import { RoutingRequest } from "./RoutingRequest";
import { ProviderCapabilities } from "./ProviderCapabilities";
import { RoutingExplanation } from "./RoutingExplanation";
import { ProviderCredentialContext } from "../providers/credentials/ProviderCredentialContext";

export interface RoutingContext {

    request: RoutingRequest;

    provider?: string;

    providerCapabilities?: ProviderCapabilities;

    selectedModel?: string;

    estimatedTokens?: number;

    score?: number;

    explanation?: RoutingExplanation;

    /**
     * Runtime BYOK credential.
     * Undefined means ProviderManager should fall back
     * to the configured environment provider.
     */
    credentialContext?: ProviderCredentialContext;

    // API Key identification for usage metering
    apiKeyId?: string;
}