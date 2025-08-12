import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { promises as fs } from 'fs';

@Injectable()
export class AuthorizedKeysService implements OnModuleInit {
  private readonly logger = new Logger(AuthorizedKeysService.name);
  private authorizedKeys: Set<string> = new Set();

  constructor(private readonly envService: EnvService) {}

  async onModuleInit(): Promise<void> {
    await this.loadAuthorizedKeys();
  }

  /**
   * Load authorized keys from the file
   * If the file doesn't exist, create an empty one
   */
  async loadAuthorizedKeys(): Promise<void> {
    try {
      const filePath = this.envService.authorizedKeysFile;
      if (!filePath) {
        throw new Error('Authorized keys file path is not defined');
      }


      try {
        const content = await fs.readFile(filePath, 'utf8');
        this.parseAuthorizedKeys(content);
        this.logger.log(`Loaded ${this.authorizedKeys.size} authorized keys from ${filePath}`);
      } catch (error) {
        this.logger.warn(`Authorized keys file not found at ${filePath}, creating an empty one`);
        await this.saveAuthorizedKeys();
      }
    } catch (error) {
      this.logger.error(`Failed to load authorized keys: ${error}`);
      throw error;
    }
  }

  /**
   * Parse authorized keys from file content
   * @param content File content
   */
  private parseAuthorizedKeys(content: string): void {
    this.authorizedKeys.clear();
    
    // Split by lines and filter out empty lines and comments
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    // Add each key to the set
    for (const line of lines) {
      this.authorizedKeys.add(line);
    }
  }

  /**
   * Save authorized keys to the file
   */
  async saveAuthorizedKeys(): Promise<void> {
    try {
      const filePath = this.envService.authorizedKeysFile;
      if (!filePath) {
        throw new Error('Authorized keys file path is not defined');
      }

      const content = Array.from(this.authorizedKeys).join('\n');
      await fs.writeFile(filePath, content);
      this.logger.log(`Saved ${this.authorizedKeys.size} authorized keys to ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to save authorized keys: ${error}`);
      throw error;
    }
  }

  /**
   * Check if a public key is authorized
   * @param publicKey The public key to check
   * @returns True if the public key is authorized, false otherwise
   */
  isAuthorized(publicKey: string): boolean {
    return this.authorizedKeys.has(publicKey);
  }

  /**
   * Add a public key to the authorized keys
   * @param publicKey The public key to add
   * @returns True if the key was added, false if it already existed
   */
  async addAuthorizedKey(publicKey: string): Promise<boolean> {
    if (this.authorizedKeys.has(publicKey)) {
      return false;
    }

    this.authorizedKeys.add(publicKey);
    await this.saveAuthorizedKeys();
    return true;
  }

  /**
   * Remove a public key from the authorized keys
   * @param publicKey The public key to remove
   * @returns True if the key was removed, false if it didn't exist
   */
  async removeAuthorizedKey(publicKey: string): Promise<boolean> {
    if (!this.authorizedKeys.has(publicKey)) {
      return false;
    }

    this.authorizedKeys.delete(publicKey);
    await this.saveAuthorizedKeys();
    return true;
  }

  /**
   * Get all authorized keys
   * @returns Array of authorized keys
   */
  getAuthorizedKeys(): string[] {
    return Array.from(this.authorizedKeys);
  }
}