import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EnvService implements OnModuleInit {
	nodeUrl: string;
	issuerKeyPairFile?: string;

	onModuleInit(): any {
		// load the (required) provided node URL
		const providedNodeUrl = process.env.NODE_URL;
		if (!providedNodeUrl)
			throw new Error(`The provided NODE_URL is not defined: Got ${providedNodeUrl}`)
		this.nodeUrl = providedNodeUrl;

		// load the (optional) issuer key pair file
		this.issuerKeyPairFile = process.env.ISSUER_KEYPAIR_FILE;

	}

}