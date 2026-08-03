import { CredentialEncryption } from '../utils/CredentialEncryption';

export class CredentialEncryptionService {
    private readonly encryption: CredentialEncryption;

    constructor(secret: string) {
        this.encryption = new CredentialEncryption(secret);
    }

    /**
     * Encrypt a provider credential before storing it.
     */
    public encryptCredential(credential: string): string {
        if (!credential || credential.trim().length === 0) {
            throw new Error('Credential cannot be empty.');
        }

        return this.encryption.encrypt(credential);
    }

    /**
     * Decrypt a stored provider credential.
     */
    public decryptCredential(encryptedCredential: string): string {
        if (!encryptedCredential || encryptedCredential.trim().length === 0) {
            throw new Error('Encrypted credential cannot be empty.');
        }

        return this.encryption.decrypt(encryptedCredential);
    }

    /**
     * Check whether a credential is already encrypted.
     */
    public isEncrypted(value: string): boolean {
        return this.encryption.isEncrypted(value);
    }

    /**
     * Encrypt only if the value is not already encrypted.
     */
    public encryptIfNeeded(value: string): string {
        if (this.isEncrypted(value)) {
            return value;
        }

        return this.encryptCredential(value);
    }

    /**
     * Verify that an encrypted credential can be decrypted.
     */
    public validateEncryptedCredential(value: string): boolean {
        try {
            this.decryptCredential(value);
            return true;
        } catch {
            return false;
        }
    }
}