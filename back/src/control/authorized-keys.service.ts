import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ControlConfigService } from '../config/services/ControlConfigService';

@Injectable()
export class AuthorizedKeysService implements OnModuleInit {
    private readonly logger = new Logger(AuthorizedKeysService.name);

    constructor(private readonly controlConfig: ControlConfigService) {}

    async onModuleInit(): Promise<void> {
        // we log the list of authorized public keys
        const authorizedPublicKeys =
            this.controlConfig.getEncodedAuthorizedPublicKeys();
        for (const publicKey of authorizedPublicKeys) {
            this.logger.log(`Authorized public key: ${publicKey}`);
        }
    }

    /**
     * Check if a public key is authorized
     * @param publicKey The public key to check
     * @returns True if the public key is authorized, false otherwise
     */
    isAuthorized(publicKey: string): boolean {
        const authorizedPublicKeys =
            this.controlConfig.getEncodedAuthorizedPublicKeys();
        return authorizedPublicKeys.includes(publicKey);
    }
}
