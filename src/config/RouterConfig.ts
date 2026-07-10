import { ProviderType } from "../types/ProviderType";
import { RoutingWeights } from "../models/RoutingWeights";

export const RouterConfig = {
    defaultProvider: ProviderType.GEMINI,

    enableSmartRouting: true,

    enableCapabilityFiltering: true,

    enableProviderScoring: true,

    enableFailover: true,

    enableRetry: true,

    enableHealthChecks: true,

    routingWeights: {
        priority: 100,
        capability: 30,
        health: 20,
        latency: 15,
        reasoning: 25,
        cost: 20,
    } satisfies RoutingWeights,
} as const;