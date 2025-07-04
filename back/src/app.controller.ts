import {Body, Controller, Get, Logger, Post} from '@nestjs/common';
import { AccountCreditDto } from '../dto/account-credit.dto';
import { IssuerService } from './issuer.service';
import { EnvService } from './env.service';
import {StringSignatureEncoder} from "@cmts-dev/carmentis-sdk/server";
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


	//@Post('/creditTokenAccount')
	@OnEvent('paiement.succeeded')

	async creditAccount(
		//@Body() accountCreditDto: AccountCreditDto,
		{id}: {id: string}
	) {
		this.logger.debug(`Receiving payment notification: performing token transfer for payment ID: ${id}` )
		const payment = await this.paymentService.getPaymentById(id)
		const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
		const publicKey = signatureEncoder.decodePublicKey(payment.walletPublicKey);
		const tokenAmount = payment.amount;
		await this.issuerService.creditTokenAccount(publicKey, tokenAmount);
	}

	@Get("/networkConfig")
	getNetworkConfig() {
		return {
			nodeUrl: this.envService.nodeUrl
		}
	}
}
