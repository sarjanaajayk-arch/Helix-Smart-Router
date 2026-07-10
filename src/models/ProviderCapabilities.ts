import { ProviderType } from "../types/ProviderType";

export interface ProviderCapabilities {
    provider: ProviderType;

    supportsChat: boolean;

    supportsVision: boolean;

    supportsCoding: boolean;

    supportsReasoning: boolean;

    supportsStreaming: boolean;

    supportsLongContext: boolean;
}