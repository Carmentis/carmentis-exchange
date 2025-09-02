import { Module } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { EnvModule } from '../env/env.module';
import { CryptoService } from './crypto.service';

@Module({
    imports: [EnvModule],
    controllers: [],
    providers: [CryptoService],
    exports: [CryptoService],
})
export class CryptoModule {

}