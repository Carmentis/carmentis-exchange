import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class NodeDto {
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @IsNotEmpty()
  @IsString()
  endpoint: string;

  @IsBoolean()
  isValidator: boolean;

  @IsEnum(['pending', 'active', 'inactive'])
  status: 'pending' | 'active' | 'inactive';

  createdAt: Date;
  updatedAt: Date;
}

export class CreateNodeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @IsNotEmpty()
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsBoolean()
  isValidator?: boolean;
}

export class UpdateNodeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsBoolean()
  isValidator?: boolean;

  @IsOptional()
  @IsEnum(['pending', 'active', 'inactive'])
  status?: 'pending' | 'active' | 'inactive';
}