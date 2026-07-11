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
}