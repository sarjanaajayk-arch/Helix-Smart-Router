import { RoutingRequest } from "./RoutingRequest";
import { ProviderCapabilities } from "./ProviderCapabilities";
import { RoutingExplanation } from "./RoutingExplanation";

export interface RoutingContext {

    request: RoutingRequest;

    provider?: string;

    providerCapabilities?: ProviderCapabilities;

    selectedModel?: string;

    estimatedTokens?: number;

    score?: number;

    explanation?: RoutingExplanation;
}