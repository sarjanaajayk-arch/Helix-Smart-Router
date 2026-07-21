import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";
import { HealthMonitor } from "./HealthMonitor";

export class CapabilityFilter {
    public static filter(
        providers: ProviderCapabilities[],
        taskType: TaskType
    ): ProviderCapabilities[] {

        return providers.filter((provider) => {

            if (!provider.enabled) {
                return false;
            }

            if (!HealthMonitor.isHealthy(provider.provider)) {
                return false;
            }

            switch (taskType) {

                case TaskType.CHAT:
                    return provider.supportsChat;

                case TaskType.CODE:
                    return provider.supportsCoding;

                case TaskType.VISION:
                    return provider.supportsVision;

                case TaskType.REASONING:
                    return provider.supportsReasoning;

                case TaskType.SUMMARIZATION:
                    return provider.supportsChat; // Summarization uses chat capability

                case TaskType.TRANSLATION:
                    return provider.supportsChat; // Translation uses chat capability

                case TaskType.CLASSIFICATION:
                    return provider.supportsChat; // Classification uses chat capability

                case TaskType.SEARCH:
                    return provider.supportsChat; // Search uses chat capability

                case TaskType.AGENT:
                    return provider.supportsChat; // Agent uses chat capability

                default:
                    return provider.supportsChat; // Default to chat capability
            }

        });

    }
}