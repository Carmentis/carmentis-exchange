import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { IssuerService } from './issuer.service';
import { LoggingMiddleware } from './logging.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StancerCardPaymentService } from './payment/stancer/stancer-card-payment.service';
import { FaucetConfigModule } from './config/faucet-config.module';
import { FaucetConfigService } from './config/services/faucet-config.service';
import { CryptoService } from './crypto/crypto.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentEntity } from './payment/entities/payment.entity';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';

export const DB_STORAGE = 'db.sqlite';
export const CARD_PAYMENT_SERVICE = Symbol('CARD_PAYMENT_SERVICE');

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot(),
        FaucetConfigModule,
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
            imports: [FaucetConfigModule],
            inject: [FaucetConfigService],
            useFactory: async (controlConfig: FaucetConfigService) => ({
                type: 'sqlite',
                database: join(
                    controlConfig.getSpecifiedStoragePath(),
                    DB_STORAGE,
                ),
                entities: [__dirname + '/**/*.entity.{ts,js}'],
                synchronize: true,
            }),
        }),
        TypeOrmModule.forFeature([PaymentEntity]),
    ],
    controllers: [AppController, PaymentController],
    providers: [
        IssuerService,
        CryptoService,
        StancerCardPaymentService,
        {
            provide: CARD_PAYMENT_SERVICE,
            useClass: StancerCardPaymentService,
        },
    ],
    exports: [CryptoService, CARD_PAYMENT_SERVICE],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply to all routes
    }
}
