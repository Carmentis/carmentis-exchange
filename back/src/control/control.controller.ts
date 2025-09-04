import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Req, UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { NodeService } from './node.service';
import {
  GenerateChallengeResponseDto,
  VerifyChallengeRequestDto,
  VerifyChallengeResponseDto,
  AuthStatusResponseDto,
} from './dto/auth.dto';
import { NodeStatusResponseDto } from './dto/node-status.dto';
import { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SetNodeAsValidatorRequestDto } from './dto/setNodeAsValidator/SetNodeAsValidatorRequestDto';
import { ControlConfigService } from '../config/services/ControlConfigService';


@UseGuards(JwtAuthGuard)
@Controller('/api/control')
export class ControlController {
  private readonly logger = new Logger(ControlController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly nodeService: NodeService,
    private readonly controlConfig: ControlConfigService,
  ) {}

  /**
   * Generate a new authentication challenge
   * @returns The generated challenge
   */
  @Public()
  @Post('auth/challenge')
  @HttpCode(HttpStatus.OK)
  async generateChallenge(): Promise<GenerateChallengeResponseDto> {
    this.logger.log('Generating authentication challenge');
    return this.authService.generateChallenge();
  }

  /**
   * Verify a challenge signature
   * @param verifyChallengeDto The challenge verification data
   * @returns The JWT token if the signature is valid
   */
  @Public()
  @Post('auth/verify')
  @HttpCode(HttpStatus.OK)
  async verifyChallenge(
    @Body() verifyChallengeDto: VerifyChallengeRequestDto,
  ): Promise<VerifyChallengeResponseDto> {
    this.logger.log(`Verifying challenge: ${verifyChallengeDto.challengeId}`);
    return this.authService.verifyChallenge(
      verifyChallengeDto.challengeId,
      verifyChallengeDto.signature,
      verifyChallengeDto.publicKey,
    );
  }

  /**
   * Get the authentication status
   * @param req The request object
   * @returns The authentication status
   */
  @Get('auth/status')
  async getAuthStatus(@Req() req: Request): Promise<AuthStatusResponseDto> {
    this.logger.log('Getting authentication status');
    return {
      publicKey: req['publicKey'],
      authenticated: true,
    };
  }

  @Put('nodes/validator')
  async setNodeAsValidator(
    @Body() body: SetNodeAsValidatorRequestDto,
  ): Promise<boolean> {
    const { nodePublicKey, nodePublicKeyType } = body;
    this.logger.log(
      `Setting node with Public Key ${nodePublicKey} as validator`,
    );
    if (body.asValidator) {
      return this.nodeService.setAsValidator(nodePublicKey, nodePublicKeyType);
    } else {
      return this.nodeService.setAsReplicator(nodePublicKey, nodePublicKeyType);
    }
  }

  /**
   * Get information about the connected node
   * @returns The connected node information
   */
  @Get('connectedNode')
  async getConnectedNode(): Promise<{ nodeEndpoint: string }> {
    return { nodeEndpoint: this.controlConfig.getNodeUrl() };
  }
}