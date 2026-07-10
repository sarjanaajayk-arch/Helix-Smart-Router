import { TaskType } from "../types/TaskType";

export interface RoutingRequest {
    prompt: string;

    taskType: TaskType;

    provider?: string;

    model?: string;

    temperature?: number;

    maxTokens?: number;

    stream?: boolean;
}