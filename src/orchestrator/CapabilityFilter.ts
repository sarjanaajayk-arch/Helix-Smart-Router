import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";

export class CapabilityFilter {
    public static filter(
        providers: ProviderCapabilities[],
        taskType: TaskType
    ): ProviderCapabilities[] {

        return providers.filter((provider) => {

            if (!provider.enabled || !provider.healthy) {
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

                default:
                    return false;
            }

        });

    }
}