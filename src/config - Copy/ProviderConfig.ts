import { ProviderType } from "../types/ProviderType";

export const ProviderConfig = {
    [ProviderType.GEMINI]: {
        enabled: true,
        priority: 1,
        timeoutMs: 30_000,
    },

    [ProviderType.OPENROUTER]: {
        enabled: true,
        priority: 2,
        timeoutMs: 30_000,
    },
} as const;