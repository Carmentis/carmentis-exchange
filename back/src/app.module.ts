import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { IssuerService } from './issuer.service';
import { EnvService } from './env/env.service';
import { LoggingMiddleware } from './logging.service';
import { PaymentModule } from './payment/payment.module';
import { ControlModule } from './control/control.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule, ConfigService} from '@nestjs/config';
import {EventEmitterModule} from "@nestjs/event-emitter";
import {StancerCardPaymentService} from "./payment/stancer/stancer-card-payment.service";
import { EnvModule } from './env/env.module';

export const DB_STORAGE = 'db.sqlite';
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PaymentModule,
    ControlModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: DB_STORAGE,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: true,
    }),
    EnvModule,
  ],
  controllers: [AppController],
  providers: [IssuerService, StancerCardPaymentService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply to all routes
  }
}
