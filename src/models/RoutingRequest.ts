import { TaskType } from "../types/TaskType";
import { RoutingPolicy } from "../types/RoutingPolicy";

export interface RoutingRequest {

    prompt: string;

    taskType: TaskType;

    provider?: string;

    model?: string;

    /**
     * Controls how Helix should optimize routing.
     * Defaults to BALANCED if not specified.
     */
    policy?: RoutingPolicy;

    temperature?: number;

    maxTokens?: number;

    stream?: boolean;
}