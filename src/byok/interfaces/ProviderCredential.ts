import {
    AuthenticationType,
    CredentialStatus,
    ProviderType
} from "../types/ProviderCredentialTypes";

/**
 * Represents a stored BYOK provider credential.
 * The credential field must always contain the encrypted value.
 */
export interface ProviderCredential {
    id: string;

    /**
     * Organization that owns this credential.
     */
    organizationId: string;

    provider: ProviderType;

    authType: AuthenticationType;

    displayName: string;

    /**
     * Encrypted credential value.
     * Never store plaintext API keys.
     */
    credential: string;

    status: CredentialStatus;

    createdAt: Date;

    updatedAt: Date;

    lastUsedAt?: Date;

    lastTestedAt?: Date;

    expiresAt?: Date;

    metadata?: Record<string, string>;
}