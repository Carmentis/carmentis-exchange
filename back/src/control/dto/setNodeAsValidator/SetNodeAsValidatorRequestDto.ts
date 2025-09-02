import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetNodeAsValidatorRequestDto {
  @IsBoolean()
  asValidator: boolean;

  @IsString()
  @IsNotEmpty()
  nodePublicKey: string;

  @IsString()
  @IsNotEmpty()
  nodePublicKeyType: string;
}