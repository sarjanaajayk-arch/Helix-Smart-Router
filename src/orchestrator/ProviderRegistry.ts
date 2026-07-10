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

        // Operational metadata
        priority: 1,

        estimatedLatency: 350,

        costPerMillionInputTokens: 0,

        costPerMillionOutputTokens: 0,

        maxContextWindow: 1_000_000,

        healthy: true,

        enabled: true,
    },
];