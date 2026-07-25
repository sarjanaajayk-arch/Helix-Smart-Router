import { PROVIDERS } from "./ProviderRegistry";
import { ProviderSelector } from "./ProviderSelector";
import { ProviderCapabilities } from "../models/ProviderCapabilities";

import { TaskType } from "../types/TaskType";
import { ModelRegistryService } from "../registry/ModelRegistryService";
import { CapabilityFilter } from "./CapabilityFilter";

export class RoutingRules {

    private static readonly DEFAULT_MODEL = "gemini-2.5-flash";

    static selectProvider(taskType: TaskType, requestedModel?: string): string {

        // If user requested a specific model, prefer that model's provider
        if (requestedModel) {
            const model = ModelRegistryService.getModelById(requestedModel);
            if (model && model.enabled) {
                const modelProvider = model.provider;
                // Check if this provider is available and healthy for the task
                const providerCapabilities = PROVIDERS.find(p => p.provider === modelProvider);
                if (providerCapabilities && providerCapabilities.enabled) {
                    // Verify provider supports the task type
                    const filtered = CapabilityFilter.filter([providerCapabilities], taskType);
                    if (filtered.length > 0) {
                        return modelProvider;
                    }
                }
            }
        }

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