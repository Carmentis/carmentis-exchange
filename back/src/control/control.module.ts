import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ControlController } from './control.controller';
import { AuthService } from './auth.service';
import { NodeService } from './node.service';
import { AuthChallengeEntity } from './entities/auth-challenge.entity';
import { NodeEntity } from './entities/node.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthChallengeEntity, NodeEntity]),
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ControlController],
  providers: [AuthService, NodeService],
  exports: [AuthService, NodeService, TypeOrmModule],
})
export class ControlModule {}