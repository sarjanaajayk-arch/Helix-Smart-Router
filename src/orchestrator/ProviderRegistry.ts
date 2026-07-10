import { ProviderConfig } from "../config/ProviderConfig";
import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { ProviderType } from "../types/ProviderType";

export const PROVIDERS: ProviderCapabilities[] = [
    {
        provider: ProviderType.GEMINI,

        // Features
        supportsChat: true,
        supportsVision: true,
        supportsCoding: true,
        supportsReasoning: true,
        supportsStreaming: true,
        supportsLongContext: true,

        // Configuration
        priority: ProviderConfig[ProviderType.GEMINI].priority,

        estimatedLatency: 350,

        costPerMillionInputTokens: 0,

        costPerMillionOutputTokens: 0,

        maxContextWindow: 1_000_000,

        healthy: true,

        enabled: ProviderConfig[ProviderType.GEMINI].enabled,
    },

    {
        provider: ProviderType.OPENROUTER,

        // Features
        supportsChat: true,
        supportsVision: true,
        supportsCoding: true,
        supportsReasoning: true,
        supportsStreaming: true,
        supportsLongContext: true,

        // Configuration
        priority: ProviderConfig[ProviderType.OPENROUTER].priority,

        estimatedLatency: 500,

        costPerMillionInputTokens: 0,

        costPerMillionOutputTokens: 0,

        maxContextWindow: 128_000,

        healthy: true,

        enabled: ProviderConfig[ProviderType.OPENROUTER].enabled,
    },
];