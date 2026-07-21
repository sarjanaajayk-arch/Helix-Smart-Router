import { PROVIDERS } from "./ProviderRegistry";
import { ProviderSelector } from "./ProviderSelector";
import { ProviderCapabilities } from "../models/ProviderCapabilities";

import { TaskType } from "../types/TaskType";

export class RoutingRules {

    private static readonly DEFAULT_MODEL = "gemini-2.5-flash";

    static selectProvider(taskType: TaskType): string {

        // Future:
        // Filter providers based on task capabilities.

       const provider = ProviderSelector.select(
    PROVIDERS,
    taskType
);

        return provider.provider;
    }

    static getAllProviders(): string[] {
        return PROVIDERS
            .filter((p: ProviderCapabilities) => p.enabled)
            .map((p: ProviderCapabilities) => p.provider);
    }

    static selectModel(taskType: TaskType): string {

        switch (taskType) {

            case TaskType.CHAT:
            case TaskType.CODE:
            case TaskType.REASONING:
            case TaskType.VISION:
                return this.DEFAULT_MODEL;

            default:
                return this.DEFAULT_MODEL;
        }
    }
}