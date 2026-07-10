import { ProviderType } from "../types/ProviderType";

export const RouterConfig = {
    defaultProvider: ProviderType.GEMINI,

    enableSmartRouting: true,

    enableCapabilityFiltering: true,

    enableProviderScoring: true,

    enableFailover: true,

    enableRetry: true,

    enableHealthChecks: true,
} as const;