import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { ProviderType } from "../types/ProviderType";

export const PROVIDERS: ProviderCapabilities[] = [
    {
        provider: ProviderType.GEMINI,

        supportsChat: true,

        supportsVision: true,

        supportsCoding: true,

        supportsReasoning: true,

        supportsStreaming: true,

        supportsLongContext: true,
    },
];