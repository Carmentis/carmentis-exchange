import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, } from '@nestjs/common';
import {
    AccountVb,
    CMTSToken,
    CryptoEncoderFactory,
    FeesCalculationFormulaFactory,
    Hash,
    PrivateSignatureKey,
    Provider,
    ProviderFactory,
    PublicSignatureKey,
    SectionType,
} from '@cmts-dev/carmentis-sdk/server';

import { CryptoService } from './crypto/crypto.service';
import { FaucetConfigService } from './config/services/faucet-config.service';
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
    private issuerPrivateKey: PrivateSignatureKey;
    private issuerPublicKey: PublicSignatureKey;

    constructor(
        private readonly controlConfigService: FaucetConfigService,
        private readonly cryptoService: CryptoService,
    ) {}

    /**
     * Initializes the issuer service by loading or creating key pairs
     * and setting up the issuer account on the blockchain.
     */
    async onModuleInit(): Promise<void> {
        this.nodeUrl = this.controlConfigService.getNodeUrl();
        this.issuerPrivateKey = await this.cryptoService.getIssuerPrivateKey();
        this.issuerPublicKey = await this.issuerPrivateKey.getPublicKey();

        // ensure that account is defined on the blockchain (otherwise abort)
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        this.logger.log(
            `Checking if issuer account (${await encoder.encodePublicKey(this.issuerPublicKey)}) exists on chain (${this.nodeUrl})`,
        );
        await this.abortIfIssuerAccountIsUndefined();
    }

    private async abortIfIssuerAccountIsUndefined() {
        // Initialize blockchain connection
        const issuerPrivateKey = await this.cryptoService.getIssuerPrivateKey();
        const blockchain = this.createBlockchainConnection();
        const issuerAccountPublicKey = await issuerPrivateKey.getPublicKey();

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
     * Creates a provider with a node
     * @returns A Blockchain instance
     */
    private createBlockchainConnection(): Provider {
        return ProviderFactory.createInMemoryProviderWithExternalProvider(
            this.nodeUrl,
        );;
    }

    /**
     * Initializes the issuer account by checking if it exists.
     * @param blockchain The blockchain instance
     * @param publicKey The public key of the issuer
     */
    private async isAccountPublishedOnChain(
        blockchain: Provider,
        publicKey: PublicSignatureKey,
    ): Promise<boolean> {
        const explorer = blockchain;

        // Check if the issuer account already exists
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        this.logger.log(
            `Checking existence of issuer account based on the public key ${await encoder.encodePublicKey(publicKey)}`,
        );
        try {
            this.issuerAccountHash =
                Hash.from(await explorer.getAccountIdByPublicKey(publicKey));
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
        const transferredAmount = tokenAmount.getAmountAsAtomic();
        const isNegativeOrZero = transferredAmount <= 0;
        const isAboveAllowedMax = MAXIMAL_ALLOWED_TOKEN_TRANSFER < tokenAmount.getAmount();
        if ( isNegativeOrZero || isAboveAllowedMax ) {
            throw new BadRequestException(
                `Invalid amount of token transfer: Should be between zero (excluded) and ${MAXIMAL_ALLOWED_TOKEN_TRANSFER}`,
            );
        }

        // Create blockchain connection
        const blockchain = this.createBlockchainConnection();
        const explorer = blockchain;

        // Log the operation
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        this.logger.debug(
            `Crediting ${tokenAmount} tokens to account with public key ${await encoder.encodePublicKey(buyerPublicKey)}`,
        );

        try {
            // Try to find existing account
            const buyerAccountHash =
                Hash.from(await explorer.getAccountIdByPublicKey(buyerPublicKey));
            await this.creditExistingAccount(
                this.issuerPrivateKey,
                blockchain,
                buyerAccountHash,
                tokenAmount,
            );
        } catch (error) {
            // Account doesn't exist, create a new one
            this.logger.warn(`Buyer account not found: ${error}`);
            await this.createAndCreditNewAccount(
                this.issuerPrivateKey,
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
        issuerPrivateSignatureKey: PrivateSignatureKey,
        blockchain: Provider,
        buyerPublicKey: PublicSignatureKey,
        tokenAmount: CMTSToken,
    ): Promise<Hash> {
        this.logger.log('Creating new token account...');

        const issuerAccountHash = this.issuerAccountHash;
        const accountCreationMb = await AccountVb.createAccountCreationMicroblock(
            buyerPublicKey,
            tokenAmount,
            issuerAccountHash.toBytes(),
        );
        const feesCalculationFormulaVersion = (await blockchain.getProtocolVariables()).getFeesCalculationVersion();
        const feesCalculationFormula = FeesCalculationFormulaFactory.getFeesCalculationFormulaByVersion(
            feesCalculationFormulaVersion
        );
        accountCreationMb.setGas(await feesCalculationFormula.computeFees(
            issuerPrivateSignatureKey.getSignatureSchemeId(),
            accountCreationMb
        ));
        await accountCreationMb.seal(issuerPrivateSignatureKey, {
            feesPayerAccount: issuerAccountHash.toBytes(),
        });

        // publish
        await blockchain.publishMicroblock(accountCreationMb);

        //const hash = await account.publishUpdates();
        const hash = accountCreationMb.getHash();

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
        issuerPrivateSignatureKey: PrivateSignatureKey,
        blockchain: Provider,
        receiverAccountHash: Hash,
        tokenAmount: CMTSToken,
    ): Promise<Hash> {
        this.logger.log(
            `Transferring ${tokenAmount.toString()} tokens to existing account at ${receiverAccountHash.encode()}`,
        );

        const explorer = blockchain;
        const senderAccountHash = await explorer.getAccountIdFromPublicKey(
            this.issuerPublicKey,
        );
        const senderAccount = await blockchain.loadAccountVirtualBlockchain(senderAccountHash);
        const tokenTransferMb = await senderAccount.createMicroblock();
        tokenTransferMb.addSection({
            type: SectionType.ACCOUNT_TRANSFER,
            amount: tokenAmount.getAmountAsAtomic(),
            publicReference: '',
            privateReference: '',
            account: receiverAccountHash.toBytes(),
        });
        const feesCalculationFormulaVersion = (
            await blockchain.getProtocolVariables()
        ).getFeesCalculationVersion();
        const feesCalculationFormula =
            FeesCalculationFormulaFactory.getFeesCalculationFormulaByVersion(
                feesCalculationFormulaVersion,
            );
        tokenTransferMb.setGas(
            await feesCalculationFormula.computeFees(
                issuerPrivateSignatureKey.getSignatureSchemeId(),
                tokenTransferMb,
            ),
        );

        const issuerAccountHash = this.issuerAccountHash;
        await tokenTransferMb.seal(issuerPrivateSignatureKey, {
            feesPayerAccount: issuerAccountHash.toBytes(),
        })

        // publish
        const hash = tokenTransferMb.getHash();
        this.logger.log(`Transferring ${tokenAmount} tokens to account id ${hash.encode()}`)
        console.log(tokenTransferMb.toString())
        await blockchain.publishMicroblock(tokenTransferMb);
        //console.log(tokenTransferMb.toString())

        this.logger.log(
            `Transfer of ${tokenAmount} tokens completed successfully to account ${receiverAccountHash.encode()}`,
        );
        return hash;
    }
}
