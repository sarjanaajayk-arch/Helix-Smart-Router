import { ProviderType } from "../types/ProviderType";

export interface ProviderCapabilities {
    provider: ProviderType;

    // Features
    supportsChat: boolean;
    supportsVision: boolean;
    supportsCoding: boolean;
    supportsReasoning: boolean;
    supportsStreaming: boolean;
    supportsLongContext: boolean;

    // Operational metadata
    priority: number;

    estimatedLatency: number;

    costPerMillionInputTokens: number;

    costPerMillionOutputTokens: number;

    maxContextWindow: number;

    healthy: boolean;

    enabled: boolean;
}