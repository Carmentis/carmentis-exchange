import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { IssuerService } from './issuer.service';
import { EnvService } from './env.service';
import { LoggingMiddleware } from './logging.service';

@Module({
  imports: [
  ],
  controllers: [AppController],
  providers: [EnvService, IssuerService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply to all routes
  }
}
