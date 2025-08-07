import { Module } from '@nestjs/common';
import { EnvService } from './env.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {

}
