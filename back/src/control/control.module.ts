import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ControlController } from './control.controller';
import { AuthService } from './auth.service';
import { NodeService } from './node.service';
import { AuthorizedKeysService } from './authorized-keys.service';
import { AuthChallengeEntity } from './entities/auth-challenge.entity';
import { NodeEntity } from './entities/node.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { ControlConfigModule } from '../config/control-config.module';
import { ControlConfigService } from '../config/services/ControlConfigService';

@Module({
    imports: [
        ControlConfigModule,
        CryptoModule,
        TypeOrmModule.forFeature([AuthChallengeEntity, NodeEntity]),
        ConfigModule.forRoot(),
        JwtModule.registerAsync({
            imports: [ControlConfigModule],
            inject: [ControlConfigService],
            useFactory: (configService: ControlConfigService) => ({
                secret: configService.getJwtSecret(),
            }),
        }),
    ],
    controllers: [ControlController],
    providers: [AuthService, NodeService, AuthorizedKeysService],
    exports: [AuthService, NodeService, AuthorizedKeysService, TypeOrmModule],
})
export class ControlModule {}
