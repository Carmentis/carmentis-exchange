import { Module } from '@nestjs/common';
import { FaucetConfigService } from './services/faucet-config.service';

@Module({
    providers: [FaucetConfigService],
    exports: [FaucetConfigService],
})
export class FaucetConfigModule {}
