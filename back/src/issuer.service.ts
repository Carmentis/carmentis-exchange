import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	NotImplementedException,
	OnModuleInit
} from '@nestjs/common';
import * as sdk from '@cmts-dev/carmentis-sdk/server';
import { EnvService } from './env.service';
import { promises as fs } from 'fs';
import * as path from 'path';

const MAXIMAL_ALLOWED_TOKEN_TRANSFER = 50;

@Injectable()
export class IssuerService implements OnModuleInit{
	private logger = new Logger(IssuerService.name);
	private issuerAccountHash: string;

	constructor(
		private readonly envService: EnvService
	) {
	}

	async onModuleInit() {
		this.logger.log("Creating root account");

		const keyPairFilePath = this.envService.issuerKeyPairFile;
		const defaultKeyPairFilePath = path.join(process.cwd(), './issuer-keypair.json');
		let issuerPrivateKey = sdk.crypto.generateKey256();
		let issuerPublicKey = sdk.crypto.secp256k1.publicKeyFromPrivateKey(issuerPrivateKey);
		try {
			// Check if the key pair file exists
			const keyPairFile = await fs.readFile(keyPairFilePath || defaultKeyPairFilePath, 'utf8');
			const { privateKey, publicKey } = JSON.parse(keyPairFile);

			if (privateKey && publicKey) {
				this.logger.log('Loaded existing key pair from file');
				issuerPrivateKey = privateKey;
				issuerPublicKey = publicKey;
			} else {
				throw new Error('Invalid key pair file, generating a new pair...');
			}
		} catch (err) {
			// If file is not found or invalid, generate a new key pair
			this.logger.warn('Key pair file not found or invalid, generating a new pair...');

			const keyPair = JSON.stringify(
				{
					privateKey: issuerPrivateKey,
					publicKey: issuerPublicKey,
				},
				null,
				2,
			);

			if (keyPairFilePath) {
				await fs.writeFile(keyPairFilePath, keyPair);
				this.logger.log(`New key pair generated and saved to file ${keyPairFilePath}`);
			} else {
				await fs.writeFile(defaultKeyPairFilePath, keyPair);
				this.logger.log(`New key pair generated and saved to (default) file ${defaultKeyPairFilePath}`);
			}
		}

		// set the issuer private key and update the
		sdk.blockchain.blockchainCore.setNode(this.envService.nodeUrl);
		sdk.blockchain.blockchainCore.setUser(
			sdk.blockchain.ROLES.USER,
			issuerPrivateKey
		);

		// check if the issuer account already exists, in such case only loads
		// the hash of the issuer's account
		this.logger.log(`Checking existence of issuer account based on the public key ${issuerPublicKey}`);
		try {
			this.issuerAccountHash = await sdk.blockchain.blockchainQuery
				.getAccountByPublicKey(issuerPublicKey);
			this.logger.log(`Issuer account located at hash ${this.issuerAccountHash}`);
			return;
		}catch (e) {
			this.logger.warn(`Issuer account not found (${e})`);
		}



		const vb = new sdk.blockchain.accountVb();
		await vb.addTokenIssuance({
			issuerPublicKey: issuerPublicKey,
			amount: sdk.constants.ECO.INITIAL_OFFER
		});

		vb.setGasPrice(sdk.constants.ECO.TOKEN);
		await vb.sign();

		try {
			this.logger.log("Attempting to create the issuer account...")
			const mb = await vb.publish();
			this.issuerAccountHash = mb.hash;
			this.logger.log("Issuer account created successfully !")
			this.logger.log(`Issuer account hash: ${this.issuerAccountHash}`);
		} catch (e) {
			this.logger.warn(`Issuer account creation failure: ${e}`)
		}
	}

	async creditTokenAccount(buyerPublicKey: string, tokenAmount: number ) {

		if (!this.issuerAccountHash)
			throw new NotFoundException("Issuer account not found");

		// cap the maximal number of tokens
		if (MAXIMAL_ALLOWED_TOKEN_TRANSFER >= 0 && MAXIMAL_ALLOWED_TOKEN_TRANSFER < tokenAmount)
			throw new BadRequestException(`Maximal amount of token transfer reached: Currently limited to ${MAXIMAL_ALLOWED_TOKEN_TRANSFER}`)

		// attempt to access the token account
		try {
			const buyerAccountHash = await sdk.blockchain.blockchainQuery.getAccountByPublicKey(
				buyerPublicKey
			);
			await this.creditAccount(buyerAccountHash, tokenAmount)
		} catch (e) {
			this.logger.warn(e)
			await this.createAndCreditAccount(buyerPublicKey, tokenAmount)
		}


	}

	private async createAndCreditAccount(buyerPublicKey: string, tokenAmount: number) {
		this.logger.log("Creating token account...");
		let rootAccountVbHash = this.issuerAccountHash;
		let vb = new sdk.blockchain.accountVb();
		vb.setGasPrice(sdk.constants.ECO.TOKEN);

		await vb.create({
			sellerAccount: rootAccountVbHash,
			buyerPublicKey: buyerPublicKey,
			amount: tokenAmount * sdk.constants.ECO.TOKEN
		});
		await vb.sign();
		const mb = await vb.publish();
		this.logger.log(`Token account created (${mb.hash}) with initial account of ${tokenAmount} tokens`)
	}

	private async creditAccount(buyerAccountHash: string, tokenAmount: number) {
		this.logger.log(`Transferring ${tokenAmount} tokens from root account to existing buyer account`);
		const vb = new sdk.blockchain.accountVb();
		await vb.load(this.issuerAccountHash);

		const transfer = vb.createTransfer(buyerAccountHash, tokenAmount * sdk.constants.ECO.TOKEN);
		transfer.addPublicReference("public ref");
		transfer.addPrivateReference("private ref");
		await transfer.commit();

		await vb.sign();

		vb.setGasPrice(sdk.constants.ECO.TOKEN);
		await vb.publish();
	}
}