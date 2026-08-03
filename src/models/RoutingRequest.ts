import { RoutingPolicy } from "../types/RoutingPolicy";
import { TaskType } from "../types/TaskType";
import { ProviderCredentialContext } from "../providers/credentials/ProviderCredentialContext";

export interface RoutingRequest {
    prompt: string;

    taskType: TaskType;

    provider?: string;

    model?: string;

    policy?: RoutingPolicy;

    temperature?: number;

    maxTokens?: number;

    stream?: boolean;

    /**
     * Runtime BYOK credential.
     * Undefined means use the configured environment provider.
     */
    credentialContext?: ProviderCredentialContext;

    // API Key identification for usage metering
    apiKeyId?: string;

    // Unique request identifier for usage metering and tracing
    requestId?: string;
}