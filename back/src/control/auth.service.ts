import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthChallengeEntity } from './entities/auth-challenge.entity';
import { randomBytes } from 'crypto';
import { BytesToHexEncoder, EncoderFactory, StringSignatureEncoder } from '@cmts-dev/carmentis-sdk/server';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthorizedKeysService } from './authorized-keys.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly signatureEncoder: StringSignatureEncoder;

  constructor(
    @InjectRepository(AuthChallengeEntity)
    private readonly challengeRepository: Repository<AuthChallengeEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authorizedKeysService: AuthorizedKeysService,
  ) {
    this.signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
  }

  /**
   * Generate a new authentication challenge
   * @returns The generated challenge
   */
  async generateChallenge(): Promise<{ challengeId: string; challenge: string }> {
    // Generate a random challenge
    const hexEncoder = EncoderFactory.bytesToHexEncoder();
    const challenge = hexEncoder.encode(randomBytes(32));
    
    // Create a new challenge entity
    const challengeEntity = this.challengeRepository.create({
      challenge,
      verified: false,
    });
    
    // Save the challenge entity
    await this.challengeRepository.save(challengeEntity);
    
    this.logger.verbose(`Generated challenge: ${challengeEntity.id} -> ${challengeEntity.challenge}`);
    
    return {
      challengeId: challengeEntity.id,
      challenge,
    };
  }

  /**
   * Verify a challenge signature
   * @param challengeId The challenge ID
   * @param signature The signature
   * @param publicKey The public key
   * @returns The JWT token if the signature is valid
   */
  async verifyChallenge(
    challengeId: string,
    signature: string,
    publicKey: string,
  ): Promise<{ token: string; publicKey: string }> {
    // Find the challenge
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });
    
    // Check if the challenge exists
    if (!challenge) {
      this.logger.error(`Challenge not found: ${challengeId}`);
      throw new UnauthorizedException('Challenge not found');
    }
    
    // Check if the challenge is expired
    if (challenge.isExpired()) {
      this.logger.error(`Challenge expired: ${challengeId}`);
      throw new UnauthorizedException('Challenge expired');
    }
    
    // Check if the challenge is already verified
    if (challenge.verified) {
      this.logger.error(`Challenge already verified: ${challengeId}`);
      throw new UnauthorizedException('Challenge already verified');
    }
    
    try {
      // Decode the public key
      this.logger.verbose(`Recovering public key from: ${publicKey}`)
      const decodedPublicKey = this.signatureEncoder.decodePublicKey(publicKey);
      const hexEncoder = EncoderFactory.bytesToHexEncoder();

      // Verify the signature
      this.logger.verbose(`Verifying challenge signature: ${challenge.challenge} -> ${signature}`)
      const isValid = decodedPublicKey.verify(
        hexEncoder.decode(challenge.challenge),
        hexEncoder.decode(signature),
      );
      
      if (!isValid) {
        this.logger.error(`Invalid signature for challenge: ${challengeId}`);
        throw new UnauthorizedException('Invalid signature');
      }
      
      // Check if the public key is authorized
      if (!this.authorizedKeysService.isAuthorized(publicKey)) {
        this.logger.error(`Unauthorized public key: ${publicKey}`);
        throw new UnauthorizedException('Unauthorized key: Your public key is not in the authorized keys list');
      }
      
      // Update the challenge
      challenge.verified = true;
      challenge.publicKey = publicKey;
      challenge.verifiedAt = new Date();
      await this.challengeRepository.save(challenge);
      
      // Generate a JWT token
      const token = this.jwtService.sign(
        { publicKey },
        {
          secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
          expiresIn: '1d',
        },
      );
      
      this.logger.log(`Challenge verified: ${challengeId}`);
      
      return { token, publicKey };
    } catch (error) {
      this.logger.error(`Error verifying challenge: ${error}`);
      throw new UnauthorizedException('Invalid signature');
    }
  }

  /**
   * Validate a JWT token
   * @param token The JWT token
   * @returns The public key if the token is valid
   */
  async validateToken(token: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
      });
      
      return payload.publicKey;
    } catch (error) {
      this.logger.error(`Error validating token: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}