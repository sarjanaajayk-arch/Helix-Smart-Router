/**
 * Helix BYOK Module
 * Provider Credential Type Definitions
 */

export { ProviderType } from "../../types/ProviderType";
import { ProviderType } from "../../types/ProviderType";

export enum AuthenticationType {
    API_KEY = "api_key",
    OAUTH = "oauth",
    BEARER_TOKEN = "bearer_token",
}

export enum CredentialStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    INVALID = "invalid",
    TESTING = "testing",
    EXPIRED = "expired",
}

export interface ProviderCredentialSummary {
    id: string;
    userId: string;
    provider: ProviderType;
    authType: AuthenticationType;
    status: CredentialStatus;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
    lastTestedAt?: Date;
}

export interface CreateProviderCredentialRequest {
    provider: ProviderType;
    authType: AuthenticationType;
    displayName: string;
    credential: string;
}

export interface UpdateProviderCredentialRequest {
    displayName?: string;
    credential?: string;
    status?: CredentialStatus;
}

export interface TestConnectionResult {
    success: boolean;
    provider: ProviderType;
    message: string;
    latencyMs?: number;
    status: CredentialStatus;
}