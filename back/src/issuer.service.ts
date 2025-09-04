import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import {
    Blockchain,
    CMTSToken,
    Hash,
    PrivateSignatureKey,
    ProviderFactory,
    PublicSignatureKey,
    StringSignatureEncoder,
    TokenUnit,
} from '@cmts-dev/carmentis-sdk/server';

import { CryptoService } from './crypto/crypto.service';
import { ControlConfigService } from './config/services/ControlConfigService';
import { AxiosError } from 'axios';

/**
 * Maximum allowed token transfer amount to prevent accidental large transfers
 */
const MAXIMAL_ALLOWED_TOKEN_TRANSFER = 1000000;

/**
 * Service responsible for managing the issuer account and token operations
 * on the Carmentis blockchain.
 */
@Injectable()
export class IssuerService implements OnModuleInit {
    private readonly logger = new Logger(IssuerService.name);
    private issuerAccountHash: Hash;
    private nodeUrl: string;
    private issuerPublicKey: PublicSignatureKey;

    constructor(
        private readonly controlConfigService: ControlConfigService,
        private readonly cryptoService: CryptoService,
    ) {}

    /**
     * Initializes the issuer service by loading or creating key pairs
     * and setting up the issuer account on the blockchain.
     */
    async onModuleInit(): Promise<void> {
        this.nodeUrl = this.controlConfigService.getNodeUrl();
        const issuerPrivateKey = this.cryptoService.getIssuerPrivateKey();
        this.issuerPublicKey = issuerPrivateKey.getPublicKey();

        // ensure that account is defined on the blockchain (otherwise abort)
        const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
        this.logger.log(
            `Checking if issuer account (${encoder.encodePublicKey(this.issuerPublicKey)}) exists on chain (${this.nodeUrl})`,
        );
        await this.abortIfIssuerAccountIsUndefined();
    }

    private async abortIfIssuerAccountIsUndefined() {
        // Initialize blockchain connection
        const issuerPrivateKey = this.cryptoService.getIssuerPrivateKey();
        const blockchain = this.createBlockchainConnection(issuerPrivateKey);
        const issuerAccountPublicKey = issuerPrivateKey.getPublicKey();

        // Initialize issuer account
        const isIssuerExists = await this.isAccountPublishedOnChain(
            blockchain,
            issuerAccountPublicKey,
        );
        if (!isIssuerExists) {
            throw new Error('Issuer not found on chain');
        }
    }

    /**
     * Creates a blockchain connection using the provided private key
     * @param privateKey The private key to use for the connection
     * @returns A Blockchain instance
     */
    private createBlockchainConnection(
        privateKey: PrivateSignatureKey,
    ): Blockchain {
        const provider = ProviderFactory.createKeyedProviderExternalProvider(
            privateKey,
            this.nodeUrl,
        );
        return Blockchain.createFromProvider(provider);
    }

    /**
     * Initializes the issuer account by checking if it exists.
     * @param blockchain The blockchain instance
     * @param publicKey The public key of the issuer
     */
    private async isAccountPublishedOnChain(
        blockchain: Blockchain,
        publicKey: PublicSignatureKey,
    ): Promise<boolean> {
        const explorer = blockchain.getExplorer();

        // Check if the issuer account already exists
        const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
        this.logger.log(
            `Checking existence of issuer account based on the public key ${encoder.encodePublicKey(publicKey)}`,
        );
        try {
            this.issuerAccountHash =
                await explorer.getAccountByPublicKey(publicKey);
            this.logger.log(
                `Issuer account located at hash ${this.issuerAccountHash.encode()}`,
            );
            return true;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw error;
            }
            this.logger.warn(`Issuer account not found: ${error}`);
            //await this.createIssuerAccount(blockchain);
            return false;
        }
    }

    /**
     * Credits tokens to a buyer's account
     * @param buyerPublicKey The public key of the buyer
     * @param tokenAmount The amount of tokens to credit
     * @throws NotFoundException if issuer account is not found
     * @throws BadRequestException if token amount exceeds maximum allowed
     */
    async creditTokenAccount(
        buyerPublicKey: PublicSignatureKey,
        tokenAmount: CMTSToken,
    ): Promise<void> {
        // Validate issuer account exists
        if (!this.issuerAccountHash) {
            throw new NotFoundException('Issuer account not found');
        }

        // Validate token amount
        if (
            MAXIMAL_ALLOWED_TOKEN_TRANSFER >= 0 &&
            MAXIMAL_ALLOWED_TOKEN_TRANSFER < tokenAmount.getAmount()
        ) {
            throw new BadRequestException(
                `Maximal amount of token transfer reached: Currently limited to ${MAXIMAL_ALLOWED_TOKEN_TRANSFER}`,
            );
        }

        // Create blockchain connection
        const blockchain = this.createBlockchainConnection(
            this.cryptoService.getIssuerPrivateKey(),
        );
        const explorer = blockchain.getExplorer();

        // Log the operation
        this.logger.debug(
            `Crediting ${tokenAmount} tokens to account with public key ${buyerPublicKey.getPublicKeyAsString()}`,
        );

        try {
            // Try to find existing account
            const buyerAccountHash =
                await explorer.getAccountByPublicKey(buyerPublicKey);
            await this.creditExistingAccount(
                blockchain,
                buyerAccountHash,
                tokenAmount,
            );
        } catch (error) {
            // Account doesn't exist, create a new one
            this.logger.warn(`Buyer account not found: ${error}`);
            await this.createAndCreditNewAccount(
                blockchain,
                buyerPublicKey,
                tokenAmount,
            );
        }
    }

    /**
     * Creates a new account for a buyer and credits it with tokens
     * @param blockchain The blockchain instance
     * @param buyerPublicKey The public key of the buyer
     * @param tokenAmount The amount of tokens to credit
     * @returns The hash of the created account
     */
    private async createAndCreditNewAccount(
        blockchain: Blockchain,
        buyerPublicKey: PublicSignatureKey,
        tokenAmount: CMTSToken,
    ): Promise<Hash> {
        this.logger.log('Creating new token account...');

        const account = await blockchain.createAccount(
            this.issuerAccountHash,
            buyerPublicKey,
            tokenAmount.getAmount(TokenUnit.ATOMIC),
        );

        account.setGasPrice(CMTSToken.oneCMTS());
        const hash = await account.publishUpdates();

        this.logger.log(
            `Token account created (${hash.encode()}) with initial balance of ${tokenAmount.toString()} tokens`,
        );

        return hash;
    }

    /**
     * Credits tokens to an existing account
     * @param blockchain The blockchain instance
     * @param receiverAccountHash The hash of the receiver's account
     * @param tokenAmount The amount of tokens to credit
     */
    private async creditExistingAccount(
        blockchain: Blockchain,
        receiverAccountHash: Hash,
        tokenAmount: CMTSToken,
    ): Promise<void> {
        this.logger.log(
            `Transferring ${tokenAmount.toString()} tokens to existing account at ${receiverAccountHash.encode()}`,
        );

        const explorer = blockchain.getExplorer();
        const senderAccountHash = await explorer.getAccountByPublicKey(
            this.cryptoService.getIssuerPublicKey(),
        );
        const senderAccount = await blockchain.loadAccount(senderAccountHash);

        await senderAccount.transfer({
            account: receiverAccountHash.toBytes(),
            amount: tokenAmount.getAmountAsAtomic(),
            publicReference: '',
            privateReference: '',
        });

        senderAccount.setGasPrice(CMTSToken.oneCMTS());
        await senderAccount.publishUpdates();

        this.logger.log(
            `Transfer of ${tokenAmount} tokens completed successfully to account ${receiverAccountHash.encode()}`,
        );
    }
}
