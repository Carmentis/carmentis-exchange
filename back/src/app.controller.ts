import { Controller, Get, Logger } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import {
    CMTSToken,
    StringSignatureEncoder,
} from '@cmts-dev/carmentis-sdk/server';
import { OnEvent } from '@nestjs/event-emitter';
import { StancerCardPaymentService } from './payment/stancer/stancer-card-payment.service';
import { ControlConfigService } from './config/services/ControlConfigService';

@Controller()
export class AppController {
    private logger = new Logger(AppController.name);
    constructor(
        private readonly issuerService: IssuerService,
        private readonly controlConfig: ControlConfigService,
        private paymentService: StancerCardPaymentService,
    ) {}

    @Get()
    async hello() {
        return 'Carmentis exchange API';
    }

    @OnEvent('paiement.succeeded')
    async creditAccount({ id }: { id: string }) {
        this.logger.debug(
            `Receiving payment notification: performing token transfer for payment ID: ${id}`,
        );
        const payment = await this.paymentService.getPaymentById(id);
        const signatureEncoder =
            StringSignatureEncoder.defaultStringSignatureEncoder();
        const publicKey = signatureEncoder.decodePublicKey(
            payment.walletPublicKey,
        );
        const tokenAmount = CMTSToken.create(payment.tokens);
        await this.issuerService.creditTokenAccount(publicKey, tokenAmount);
        await this.paymentService.markPaymentAsDone(id);
    }

    @Get('/networkConfig')
    getNetworkConfig() {
        return {
            nodeUrl: this.controlConfig.getNodeUrl(),
        };
    }
}
