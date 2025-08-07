import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

/**
 * DTO for the connected node status response
 */
export class NodeStatusResponseDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsObject()
  status: any; // Using any for now, can be typed more specifically if needed

  @IsString()
  chainId: string;
}