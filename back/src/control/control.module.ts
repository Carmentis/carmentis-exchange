import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ControlController } from './control.controller';
import { AuthService } from './auth.service';
import { NodeService } from './node.service';
import { AuthChallengeEntity } from './entities/auth-challenge.entity';
import { NodeEntity } from './entities/node.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [
    EnvModule,
    TypeOrmModule.forFeature([AuthChallengeEntity, NodeEntity]),
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ControlController],
  providers: [
    AuthService, 
    NodeService,
  ],
  exports: [AuthService, NodeService, TypeOrmModule],
})
export class ControlModule {}