import { ProviderCredential } from '../interfaces/ProviderCredential';

/**
 * Database model for a stored provider credential.
 * Extends the ProviderCredential interface with
 * persistence-related metadata.
 */
export interface ProviderCredentialModel extends ProviderCredential {
    /**
     * Version number for optimistic locking.
     */
    version: number;

    /**
     * Soft delete flag.
     */
    deleted: boolean;

    
    /**
     * Timestamp when the credential was deleted.
     */
    deletedAt?: Date;
}