import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateChallengeResponseDto {
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @IsNotEmpty()
  @IsString()
  challenge: string;
}

export class VerifyChallengeRequestDto {
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  @IsString()
  publicKey: string;
}

export class VerifyChallengeResponseDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  publicKey: string;
}

export class AuthStatusResponseDto {
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @IsNotEmpty()
  authenticated: boolean;
}