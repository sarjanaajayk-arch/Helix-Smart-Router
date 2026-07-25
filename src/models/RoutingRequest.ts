import { RoutingPolicy } from "../types/RoutingPolicy";
import { TaskType } from "../types/TaskType";

export interface RoutingRequest {
    prompt: string;
    taskType: TaskType;
    provider?: string;
    model?: string;
    policy?: RoutingPolicy;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;

    // API Key identification for usage metering
    apiKeyId?: string;
    // Unique request identifier for usage metering and tracing
    requestId?: string;
}