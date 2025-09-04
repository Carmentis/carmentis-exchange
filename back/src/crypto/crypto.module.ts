import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { ControlConfigModule } from '../config/control-config.module';

@Module({
    imports: [ControlConfigModule],
    controllers: [],
    providers: [CryptoService],
    exports: [CryptoService],
})
export class CryptoModule {

}