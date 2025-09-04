import {
    Blockchain,
    CMTSToken,
    PrivateSignatureKey,
    ProviderFactory,
    PublicSignatureKey, Secp256k1PrivateSignatureKey, StringSignatureEncoder,
} from '@cmts-dev/carmentis-sdk/server';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ControlConfigService } from '../config/services/ControlConfigService';

@Injectable()
export class CryptoService implements OnModuleInit {
    private issuerPrivateKey: PrivateSignatureKey;
    private logger = new Logger(CryptoService.name);

    constructor(
        private readonly controlConfig: ControlConfigService,
    ) {}


    async onModuleInit(): Promise<void> {
        this.logger.log("Initializing issuer service");
        this.issuerPrivateKey = await this.loadIssuerPrivateKeyFromConfig();
    }




    getIssuerPrivateKey() {
        return this.issuerPrivateKey;
    }

    /**
     * This method returns the private key from the control configuration.
     * @private
     */
    private async loadIssuerPrivateKeyFromConfig(): Promise<PrivateSignatureKey> {
        const {path, sk, env} = this.controlConfig.getPrivateKeyRetrievalMethods();
        if (typeof path === 'string') {
            this.logger.log(`Loading issuer private key from file ${path}`)
            return await this.loadIssuerPrivateKeyFromPath(path);
        } else if (typeof env === 'string') {
            this.logger.log(`Loading issuer private key from env var ${env}`)
            return await this.loadIssuerPrivateKeyFromEnvVar(env)
        } else if (typeof sk === 'string') {
            this.logger.log(`Loading issuer private key from config`)
            return await this.loadIssuerPrivateKeyFromEncodedPrivateKey(sk);
        } else {
            throw new Error('No private key retrieval method specified: Have you added private key to the config?')
        }
    }
    
    private async loadIssuerPrivateKeyFromEnvVar(envVarName: string) {
        const privateKey = process.env[envVarName];
        if (typeof privateKey === 'string') {
            const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
            return encoder.decodePrivateKey(privateKey);
        } else {
            throw new Error(`Private key specified in env var name ${envVarName} but not defined.`)
        }
    }
    
    private async loadIssuerPrivateKeyFromEncodedPrivateKey(encodedPrivateKey: string) {
        const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
        return encoder.decodePrivateKey(encodedPrivateKey);
    }
    
    private async loadIssuerPrivateKeyFromPath(path: string) {
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

            const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
            const privKey = encoder.decodePrivateKey(encoded);
            this.logger.log(`Loaded issuer private key from file: ${path}`);
            return privKey;
        } catch (err: any) {
            const reason = err?.message ? `: ${err.message}` : '';
            throw new Error(`Failed to load issuer private key from path "${path}"${reason}`);
        }
    }

    getIssuerPublicKey() {
        return this.getIssuerPrivateKey().getPublicKey();
    }
}