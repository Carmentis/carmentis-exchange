import { Controller, Get, Logger } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import {
    CMTSToken,
    CryptoEncoderFactory,
} from '@cmts-dev/carmentis-sdk-core';
import { OnEvent } from '@nestjs/event-emitter';
import { StancerCardPaymentService } from './payment/stancer/stancer-card-payment.service';
import { FaucetConfigService } from './config/services/faucet-config.service';

@Controller()
export class AppController {
    private logger = new Logger(AppController.name);
    constructor(
        private readonly issuerService: IssuerService,
        private readonly controlConfig: FaucetConfigService,
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
        try {
            const payment = await this.paymentService.getPaymentById(id);
            const signatureEncoder =
                CryptoEncoderFactory.defaultStringSignatureEncoder();
            const publicKey = await signatureEncoder.decodePublicKey(
                payment.walletPublicKey,
            );
            const tokenAmount = CMTSToken.create(payment.tokens);
            await this.issuerService.creditTokenAccount(publicKey, tokenAmount);
            await this.paymentService.markPaymentAsDone(id);
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(`Error processing payment ${id}: ${e.message}`);
            } else {
                this.logger.error(`Unexpected error processing payment ${id}: ${e}`);
            }
        }
    }

    @Get('/networkConfig')
    getNetworkConfig() {
        return {
            nodeUrl: this.controlConfig.getNodeUrl(),
        };
    }
}
