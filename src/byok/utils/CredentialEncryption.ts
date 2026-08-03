import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class CredentialEncryption {
    private readonly key: Buffer;

    constructor(secret: string) {
        if (!secret || secret.trim().length === 0) {
            throw new Error('Encryption secret is required.');
        }

        // Derive a fixed 32-byte key from the supplied secret.
        this.key = crypto
            .createHash('sha256')
            .update(secret)
            .digest()
            .subarray(0, KEY_LENGTH);
    }

    /**
     * Encrypt a plaintext credential.
     */
    encrypt(plainText: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();

        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64')
        ].join(':');
    }

    /**
     * Decrypt an encrypted credential.
     */
    decrypt(cipherText: string): string {
        const parts = cipherText.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted credential format.');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const authTag = Buffer.from(parts[1], 'base64');
        const encrypted = Buffer.from(parts[2], 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    }

    /**
     * Check whether a credential appears to be encrypted
     * using this utility's format.
     */
    isEncrypted(value: string): boolean {
        return value.split(':').length === 3;
    }
}