import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StancerCardPaymentService } from './stancer/stancer-card-payment.service';
import { PaymentController } from './payment.controller';
import { PaymentEntity } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { ControlConfigModule } from '../config/control-config.module';

export const CARD_PAYMENT_SERVICE = Symbol('CARD_PAYMENT_SERVICE');

@Module({
    imports: [
        TypeOrmModule.forFeature([PaymentEntity]),
        ConfigModule.forRoot(),
        ControlConfigModule,
    ],
    controllers: [PaymentController],
    providers: [
        StancerCardPaymentService,
        {
            provide: CARD_PAYMENT_SERVICE,
            useClass: StancerCardPaymentService, // ou PaypalPaymentService
        },
    ],
    exports: [CARD_PAYMENT_SERVICE, TypeOrmModule],
})
export class PaymentModule {}
