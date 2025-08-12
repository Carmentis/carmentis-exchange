import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class EnvService implements OnModuleInit {
	private readonly logger = new Logger(EnvService.name);
	nodeUrl: string;
	issuerKeyPairFile?: string;
	controlStorage?: string;
	authorizedKeysFile?: string;

	async onModuleInit(): Promise<void> {
		// load the (required) provided node URL
		const providedNodeUrl = process.env.NODE_URL;
		if (!providedNodeUrl)
			throw new Error(`The provided NODE_URL is not defined: Got ${providedNodeUrl}`)
		this.nodeUrl = providedNodeUrl;

		// load the control storage directory
		this.controlStorage = process.env.CONTROL_STORAGE || path.join(process.cwd(), 'control-storage');
		
		// Ensure the control storage directory exists
		try {
			await fs.mkdir(this.controlStorage, { recursive: true });
			this.logger.log(`Control storage directory: ${this.controlStorage}`);
		} catch (error) {
			this.logger.error(`Failed to create control storage directory: ${error}`);
			throw error;
		}

		// Set the authorized keys file path
		this.authorizedKeysFile = path.join(this.controlStorage, 'authorized_keys');
		this.logger.log(`Authorized keys file: ${this.authorizedKeysFile}`);

		// Handle the issuer key pair file
		// First check if ISSUER_KEYPAIR_FILE is explicitly set (for backward compatibility)
		const explicitKeyPairFile = process.env.ISSUER_KEYPAIR_FILE;
		if (explicitKeyPairFile) {
			this.issuerKeyPairFile = explicitKeyPairFile;
			this.logger.log(`Using explicitly defined issuer key pair file: ${this.issuerKeyPairFile}`);
		} else {
			// Otherwise use the new location under CONTROL_STORAGE
			this.issuerKeyPairFile = path.join(this.controlStorage, 'control_key_pair.json');
			this.logger.log(`Using issuer key pair file in control storage: ${this.issuerKeyPairFile}`);
		}
	}

}