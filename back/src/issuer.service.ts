import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	NotImplementedException,
	OnModuleInit
} from '@nestjs/common';
//import * as sdk from '@cmts-dev/carmentis-sdk/server';
import {
	Blockchain, CMTSToken,
	Hash,
	PrivateSignatureKey,
	ProviderFactory, PublicSignatureKey,
	Secp256k1PrivateSignatureKey, StringSignatureEncoder, TOKEN
} from '@cmts-dev/carmentis-sdk/server';

import { EnvService } from './env.service';
import { promises as fs } from 'fs';
import * as path from 'path';

const MAXIMAL_ALLOWED_TOKEN_TRANSFER = 1000000;

@Injectable()
export class IssuerService implements OnModuleInit{
	private logger = new Logger(IssuerService.name);
	private issuerAccountHash: Hash;
	private issuerPrivateKey: PrivateSignatureKey;

	constructor(
		private readonly envService: EnvService
	) {
	}

	async onModuleInit() {
		this.logger.log("Creating root account");

		const keyPairFilePath = this.envService.issuerKeyPairFile;
		const defaultKeyPairFilePath = path.join(process.cwd(), './issuer-keypair.json');
		let issuerPrivateKey: PrivateSignatureKey = Secp256k1PrivateSignatureKey.gen();
		let issuerPublicKey = issuerPrivateKey.getPublicKey();
		const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
		try {
			// Check if the key pair file exists
			const keyPairFile = await fs.readFile(keyPairFilePath || defaultKeyPairFilePath, 'utf8');
			const { privateKey, publicKey }: {privateKey: string, publicKey: string} = JSON.parse(keyPairFile);

			if (privateKey && publicKey) {
				issuerPrivateKey = encoder.decodePrivateKey(privateKey);
				issuerPublicKey = encoder.decodePublicKey(publicKey);
				this.logger.log(`Loaded existing key pair from file: public key ${issuerPublicKey.getPublicKeyAsString()}`);
			} else {
				throw new Error('Invalid key pair file, generating a new pair...');
			}
		} catch (err) {
			// If file is not found or invalid, generate a new key pair
			this.logger.warn('Key pair file not found or invalid, generating a new pair...');


			const keyPair = JSON.stringify(
				{
					privateKey: encoder.encodePrivateKey(issuerPrivateKey),
					publicKey: encoder.encodePublicKey(issuerPublicKey),
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

		// set the issuer private key
		this.issuerPrivateKey = issuerPrivateKey;
		const provider = ProviderFactory.createKeyedProviderExternalProvider(issuerPrivateKey, this.envService.nodeUrl);
		const blockchain = Blockchain.createFromProvider(provider);
		const explorer = blockchain.getExplorer();

		// check if the issuer account already exists, in such case only loads
		// the hash of the issuer's account
		this.logger.log(`Checking existence of issuer account based on the public key ${issuerPublicKey.getPublicKeyAsString()}`);
		try {
			this.issuerAccountHash = await explorer.getAccountByPublicKey(issuerPublicKey);
			this.logger.log(`Issuer account located at hash ${this.issuerAccountHash.encode()}`);
		}catch (e) {
			this.logger.warn(`Issuer account not found (${e})`);
			console.error(e);
			this.logger.warn("Attempting to create the issuer account...")
			await this.createIssuerAccount(blockchain);
		}

	}

	private async createIssuerAccount(blockchain: Blockchain) {
		try {
			this.logger.log("Attempting to create the issuer account...")
			const issuerAccount = await  blockchain.createGenesisAccount()
			issuerAccount.setGasPrice(TOKEN);
			this.issuerAccountHash = await issuerAccount.publishUpdates();
			this.logger.log("Issuer account created successfully !")
			this.logger.log(`Issuer account hash: ${this.issuerAccountHash.encode()}`);
		} catch (e) {
			this.logger.error(`Issuer account creation failure: ${e}`)
			console.error(e);
		}
	}

	async creditTokenAccount(buyerPublicKey: PublicSignatureKey, tokenAmount: CMTSToken ) {
		// no token can be credit if the issuer account is not found
		if (!this.issuerAccountHash)
			throw new NotFoundException("Issuer account not found");

		// cap the maximal number of tokens
		if (MAXIMAL_ALLOWED_TOKEN_TRANSFER >= 0 && MAXIMAL_ALLOWED_TOKEN_TRANSFER < tokenAmount.getAmount())
			throw new BadRequestException(`Maximal amount of token transfer reached: Currently limited to ${MAXIMAL_ALLOWED_TOKEN_TRANSFER}`)

		// create the explorer and the blockchain
		const nodeUrl = this.envService.nodeUrl;
		const provider = ProviderFactory.createKeyedProviderExternalProvider(this.issuerPrivateKey, nodeUrl);
		const blockchain = Blockchain.createFromProvider(provider);
		const explorer = blockchain.getExplorer();


		// attempt to access the token account
		const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
		this.logger.debug(`Attempting to credit ${tokenAmount} tokens to the account associated to the public key ${buyerPublicKey.getPublicKeyAsString()} (or tagged public key ${signatureEncoder.encodePublicKey(buyerPublicKey)})`);
		try {
			const buyerAccountHash = await explorer.getAccountByPublicKey(buyerPublicKey);
			await this.creditAccount(blockchain, buyerAccountHash, tokenAmount)
		} catch (e) {
			this.logger.warn(e)
			await this.createAndCreditAccount(blockchain, buyerPublicKey, tokenAmount)
		}


	}


	private async createAndCreditAccount(blockchain: Blockchain, buyerPublicKey: PublicSignatureKey, tokenAmount: CMTSToken) {
		this.logger.log("Creating token account...");
		const account = await blockchain.createAccount(this.issuerAccountHash, buyerPublicKey, tokenAmount.getAmount());
		account.setGasPrice(TOKEN);
		const hash = await account.publishUpdates();
		this.logger.log(`Token account created (${hash.encode()}) with initial account of ${tokenAmount.toString()} tokens`)
		return hash;
	}

	private async creditAccount(blockchain: Blockchain, receiverAccountHash: Hash , tokenAmount: CMTSToken) {
		this.logger.log(`Transferring ${tokenAmount.toString()} tokens from root account to existing buyer account`);
		const explorer = blockchain.getExplorer();

		// load the accounts
		const senderAccountHash  = await explorer.getAccountByPublicKey(this.issuerPrivateKey.getPublicKey());

		// perform the transfer
		const senderAccount = await blockchain.loadAccount(senderAccountHash);
		await senderAccount.transfer({
			account: receiverAccountHash.toBytes(),
			amount: tokenAmount.getAmount(),
			publicReference: '',
			privateReference: ''
		})
		senderAccount.setGasPrice(TOKEN);
		await senderAccount.publishUpdates();
		this.logger.log(`Transfer completed successfully for ${tokenAmount} tokens at account hash ${receiverAccountHash.encode()} !`)

		/*
		const vb = new sdk.blockchain.accountVb(this.issuerAccountHash);
		await vb.load();

		const transfer = vb.createTransfer(buyerAccountHash, tokenAmount * sdk.constants.ECO.TOKEN);
		transfer.addPublicReference("public ref");
		transfer.addPrivateReference("private ref");
		await transfer.commit();


		vb.setGasPrice(sdk.constants.ECO.TOKEN);
		await vb.sign();

		await vb.publish();

		 */
	}
}