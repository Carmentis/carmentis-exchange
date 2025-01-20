import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { IssuerService } from './issuer.service';
import { EnvService } from './env.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'front', 'out'),
    }),
  ],
  controllers: [AppController],
  providers: [EnvService, IssuerService],
})
export class AppModule {}
