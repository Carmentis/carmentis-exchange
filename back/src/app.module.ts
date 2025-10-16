import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { IssuerService } from './issuer.service';
import { LoggingMiddleware } from './logging.service';
import { PaymentModule } from './payment/payment.module';
import { ControlModule } from './control/control.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StancerCardPaymentService } from './payment/stancer/stancer-card-payment.service';
import { CryptoModule } from './crypto/crypto.module';
import { ControlConfigModule } from './config/control-config.module';
import { ControlConfigService } from './config/services/ControlConfigService';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';

export const DB_STORAGE = 'db.sqlite';

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot(),
        ControlConfigModule,
        PaymentModule,
        ControlModule,
        CryptoModule,
        ConfigModule.forRoot(),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60000,
                    limit: 50,
                }
            ]
        }),
        TypeOrmModule.forRootAsync({
            imports: [ControlConfigModule],
            inject: [ControlConfigService],
            useFactory: async (controlConfig: ControlConfigService) => ({
                type: 'sqlite',
                database: join(
                    controlConfig.getSpecifiedStoragePath(),
                    DB_STORAGE,
                ),
                entities: [__dirname + '/**/*.entity.{ts,js}'],
                synchronize: true,
            }),
        }),
    ],
    controllers: [AppController],
    providers: [IssuerService, StancerCardPaymentService],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply to all routes
    }
}
