import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountCreditDto } from '../dto/account-credit.dto';
import { IssuerService } from './issuer.service';
import { EnvService } from './env.service';

@Controller('/')
export class AppController {
	constructor(
		private readonly issuerService: IssuerService,
		private readonly envService: EnvService,
	) {}

	@Get()
	async hello() {
		return "Carmentis exchange API";
	}

	@Post('/creditTokenAccount')
	async creditAccount(
		@Body() accountCreditDto: AccountCreditDto,
	) {

		const publicKey = accountCreditDto.publicKey;
		const tokenAmount = accountCreditDto.tokenAmount;
		console.log(publicKey, tokenAmount)
		await this.issuerService.creditTokenAccount(publicKey, tokenAmount);
	}

	@Get("/networkConfig")
	getNetworkConfig() {
		return {
			nodeUrl: this.envService.nodeUrl
		}
	}
}
