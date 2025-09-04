import { Module } from '@nestjs/common';
import { ControlConfigService } from './services/ControlConfigService';

@Module({
    providers: [ControlConfigService],
    exports: [ControlConfigService],
})
export class ControlConfigModule {}
