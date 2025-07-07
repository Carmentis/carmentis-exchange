import {Body, Controller, Get, Logger, Post} from '@nestjs/common';
import { AccountCreditDto } from '../dto/account-credit.dto';
import { IssuerService } from './issuer.service';
import { EnvService } from './env.service';
import {CMTSToken, StringSignatureEncoder} from "@cmts-dev/carmentis-sdk/server";
import {OnEvent} from "@nestjs/event-emitter";
import {CardPaymentService} from "./payment/card-payment.interface";
import {StancerCardPaymentService} from "./payment/stancer/stancer-card-payment.service";

@Controller()
export class AppController {
	private logger = new Logger(AppController.name)
	constructor(
		private readonly issuerService: IssuerService,
		private readonly envService: EnvService,
		private paymentService: StancerCardPaymentService
	) {}

	@Get()
	async hello() {
		return "Carmentis exchange API";
	}


	@OnEvent('paiement.succeeded')
	async creditAccount(
		{id}: {id: string}
	) {
		this.logger.debug(`Receiving payment notification: performing token transfer for payment ID: ${id}` )
		const payment = await this.paymentService.getPaymentById(id)
		const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
		const publicKey = signatureEncoder.decodePublicKey(payment.walletPublicKey);
		const tokenAmount = CMTSToken.create(payment.tokens);
		await this.issuerService.creditTokenAccount(publicKey, tokenAmount);
		await this.paymentService.markPaymentAsDone(id)
	}

	@Get("/networkConfig")
	getNetworkConfig() {
		return {
			nodeUrl: this.envService.nodeUrl
		}
	}
}
