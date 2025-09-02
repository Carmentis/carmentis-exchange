import {
    Blockchain,
    CMTSToken,
    PrivateSignatureKey,
    ProviderFactory,
    PublicSignatureKey, Secp256k1PrivateSignatureKey, StringSignatureEncoder,
} from '@cmts-dev/carmentis-sdk/server';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EnvService } from 'src/env/env.service';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class CryptoService implements OnModuleInit {
    private issuerPrivateKey: PrivateSignatureKey;
    private logger = new Logger(CryptoService.name);

    constructor(
        private readonly envService: EnvService,
    ) {}


    async onModuleInit(): Promise<void> {
        this.logger.log("Initializing issuer service");

        // Load or generate key pair
        const keyPairResult = await this.loadOrGenerateKeyPair();
        this.issuerPrivateKey = keyPairResult.privateKey;


    }


    getIssuerPrivateKey() {
        return this.issuerPrivateKey;
    }

    /**
     * Loads an existing key pair or generates a new one if not found
     * @returns Object containing the private and public keys
     */
    private async loadOrGenerateKeyPair(): Promise<{ privateKey: PrivateSignatureKey; publicKey: PublicSignatureKey }> {
        const keyPairFilePath = this.envService.issuerKeyPairFile;
        const defaultKeyPairFilePath = path.join(process.cwd(), './issuer-keypair.json');
        const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();

        // Default to a new key pair
        let issuerPrivateKey: PrivateSignatureKey = Secp256k1PrivateSignatureKey.gen();
        let issuerPublicKey = issuerPrivateKey.getPublicKey();

        try {
            // Try to load existing key pair
            const keyPairFile = await fs.readFile(keyPairFilePath || defaultKeyPairFilePath, 'utf8');
            const { privateKey, publicKey }: { privateKey: string; publicKey: string } = JSON.parse(keyPairFile);

            if (privateKey && publicKey) {
                issuerPrivateKey = encoder.decodePrivateKey(privateKey);
                issuerPublicKey = encoder.decodePublicKey(publicKey);
                this.logger.log(`Loaded existing key pair from file: public key ${issuerPublicKey.getPublicKeyAsString()}`);
            } else {
                throw new Error('Invalid key pair file, generating a new pair...');
            }
        } catch (err) {
            // If file is not found or invalid, generate and save a new key pair
            this.logger.warn('Key pair file not found or invalid, generating a new pair...');

            const keyPair = JSON.stringify(
                {
                    privateKey: encoder.encodePrivateKey(issuerPrivateKey),
                    publicKey: encoder.encodePublicKey(issuerPublicKey),
                },
                null,
                2
            );

            const targetPath = keyPairFilePath || defaultKeyPairFilePath;
            await fs.writeFile(targetPath, keyPair);
            this.logger.log(`New key pair generated and saved to file ${targetPath}`);
        }

        return { privateKey: issuerPrivateKey, publicKey: issuerPublicKey };
    }

    getIssuerPublicKey() {
        return this.getIssuerPrivateKey().getPublicKey();
    }
}