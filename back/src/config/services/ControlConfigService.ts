import { Injectable, Logger } from '@nestjs/common';
import { ConfigSchema, ConfigType } from '../types/config.type';
import process from 'node:process';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as toml from '@iarna/toml';

@Injectable()
export class ControlConfigService {
    private controlConfig: ConfigType;
    private logger = new Logger(ControlConfigService.name);

    constructor() {
        this.loadConfigFile();
    }

    private loadConfigFile() {
        // for resilience, we search through multiple possible config files.
        // Some filenames might be undefined due to access to env variables that might be undefined./
        const candidatesConfigFilenames: (string | undefined)[] = [
            'config.toml',
            'control-config.toml',
            'exchange-config.toml',
            process.env['CONFIG_FILENAME'],
            process.env['CONTROL_CONFIG_FILENAME'],
            process.env['EXCHANGE_CONFIG_FILENAME'],
        ];

        // we construct the candidates config file paths.
        // Be aware that the order of candidates is important since we accept the first valid one, other are ignored.
        const candidatesConfigFilePaths = [];

        // At the top priority, we check if the user has specified a config file path using an environment variable.
        const specifiedConfigPath =
            process.env['CONTROL_CONFIG'] ||
            process.env['CONFIG'] ||
            process.env['CONFIG_PATH'] ||
            undefined;
        if (specifiedConfigPath !== undefined) {
            candidatesConfigFilePaths.push(specifiedConfigPath);
        }

        // we exclude undefined filenames and appends the current working directory to each filename.
        const currentWorkDirectory = process.cwd();
        const filteredCurrentDirectoryCandidatesPaths =
            candidatesConfigFilenames
                .filter((filename) => filename !== undefined)
                .map((filename) => join(currentWorkDirectory, filename));
        candidatesConfigFilePaths.push(
            ...filteredCurrentDirectoryCandidatesPaths,
        );

        // we now search for the first config file that exists.
        for (const configPath of candidatesConfigFilePaths) {
            try {
                this.logger.log(`Loading config file from ${configPath}`);
                const config = readFileSync(configPath, 'utf8');
                const parsedConfig = toml.parse(config) as Record<
                    string,
                    unknown
                >;
                this.controlConfig = ConfigSchema.parse(parsedConfig);
                return;
            } catch (e) {
                if (e instanceof Error) {
                    this.logger.warn(
                        `Failed to load config file from ${configPath}: ${e.message}`,
                    );
                }
            }
        }

        // if we reach this point, we have not found a valid config file.
        // we throw an error.
        const formattedSearchedCandidates =
            candidatesConfigFilePaths.join(', ');
        throw new Error(
            `Failed to load config file from any of the following paths: ${formattedSearchedCandidates}`,
        );
    }

    getStancerApiKey() {
        return this.controlConfig.control.purchase.stancer.api_key;
    }

    getPrivateKeyRetrievalMethods() {
        return this.controlConfig.control.private_key;
    }

    getSpecifiedPort(): number {
        return this.controlConfig.control.port;
    }

    getSpecifiedStoragePath(): string {
        return this.controlConfig.control.storage;
    }

    getNodeUrl(): string {
        return this.controlConfig.control.node_url;
    }

    getEncodedAuthorizedPublicKeys(): string[] {
        const encodedAuthorizedPublicKeys =
            this.controlConfig.control.auth.allowed_public_keys;
        return encodedAuthorizedPublicKeys;
    }

    getJwtSecret() {
        return this.controlConfig.control.auth.jwt_secret;
    }
}
