import { ProviderType } from "../../types/ProviderType";

export interface ProviderCredentialContext {
    /**
     * Owner of the credential.
     */
    userId: string;

    /**
     * AI provider.
     */
    provider: ProviderType;

    /**
     * User's decrypted API key.
     */
    apiKey: string;

    /**
     * Optional endpoint override.
     * Useful for OpenAI-compatible providers,
     * NVIDIA NIM, Ollama, LM Studio, etc.
     */
    baseUrl?: string;

    /**
     * Optional organization/project identifier.
     */
    organization?: string;

    /**
     * Optional default model.
     */
    defaultModel?: string;
}