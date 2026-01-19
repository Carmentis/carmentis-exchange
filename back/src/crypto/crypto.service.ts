import {
    PrivateSignatureKey,
    CryptoEncoderFactory,
} from '@cmts-dev/carmentis-sdk/server';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { FaucetConfigService } from '../config/services/faucet-config.service';

@Injectable()
export class CryptoService {
    private static issuerPrivateKey: PrivateSignatureKey;
    private static logger = new Logger(CryptoService.name);
    private logger = CryptoService.logger;

    constructor(private readonly controlConfig: FaucetConfigService) {}

    async getIssuerPrivateKey(): Promise<PrivateSignatureKey> {
        if (CryptoService.issuerPrivateKey) return CryptoService.issuerPrivateKey;
        CryptoService.issuerPrivateKey = await this.loadIssuerPrivateKeyFromConfig();
        return CryptoService.issuerPrivateKey;
    }

    /**
     * This method returns the private key from the control configuration.
     * @private
     */
    private async loadIssuerPrivateKeyFromConfig(): Promise<PrivateSignatureKey> {
        const { path, sk, env } =
            this.controlConfig.getPrivateKeyRetrievalMethods();
        if (typeof path === 'string') {
            this.logger.log(`Loading issuer private key from file ${path}`);
            return await CryptoService.loadIssuerPrivateKeyFromPath(path);
        } else if (typeof env === 'string') {
            this.logger.log(`Loading issuer private key from env var ${env}`);
            return await CryptoService.loadIssuerPrivateKeyFromEnvVar(env);
        } else if (typeof sk === 'string') {
            this.logger.log(`Loading issuer private key from config`);
            return await CryptoService.loadIssuerPrivateKeyFromEncodedPrivateKey(sk);
        } else {
            throw new Error(
                'No private key retrieval method specified: Have you added private key to the config?',
            );
        }
    }

    private static async loadIssuerPrivateKeyFromEnvVar(envVarName: string) {
        const privateKey = process.env[envVarName];
        if (typeof privateKey === 'string') {
            const encoder =
                CryptoEncoderFactory.defaultStringSignatureEncoder();
            return await encoder.decodePrivateKey(privateKey);
        } else {
            throw new Error(
                `Private key specified in env var name ${envVarName} but not defined.`,
            );
        }
    }

    private static async loadIssuerPrivateKeyFromEncodedPrivateKey(
        encodedPrivateKey: string,
    ) {
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        return encoder.decodePrivateKey(encodedPrivateKey);
    }

    private static async loadIssuerPrivateKeyFromPath(path: string) {
        // We expect the specified file: 1) to exist, 2) to be a json file,
        // 3) to have a privateKey field containing the encoded private key.
        try {
            // Read file content (will throw if file does not exist)
            const content = await fs.readFile(path, 'utf8');

            // Parse JSON (will throw if invalid JSON)
            const data = JSON.parse(content);

            const encoded: unknown = data?.privateKey;
            if (typeof encoded !== 'string' || encoded.trim().length === 0) {
                throw new Error('Invalid or missing "privateKey" field');
            }

            const encoder =
                CryptoEncoderFactory.defaultStringSignatureEncoder();
            const privKey = await encoder.decodePrivateKey(encoded);
            this.logger.log(`Loaded issuer private key from file: ${path}`);
            return privKey;
        } catch (err) {
            let reason = 'Unknown reason';
            if (err instanceof Error) {
                reason = err.message;
            }
            throw new Error(
                `Failed to load issuer private key from path "${path}": ${reason}`,
            );
        }
    }

}
