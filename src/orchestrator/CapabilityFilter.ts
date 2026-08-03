import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";
import { HealthMonitor } from "./HealthMonitor";

export class CapabilityFilter {
    public static filter(
        providers: ProviderCapabilities[],
        taskType: TaskType
    ): ProviderCapabilities[] {

        console.log("🔥 CapabilityFilter taskType =", taskType);
        console.log(
            "🔥 Providers =",
            providers.map(p => ({
                provider: p.provider,
                enabled: p.enabled,
                supportsChat: p.supportsChat
            }))
        );

        return providers.filter((provider) => {
            console.log("🔥 Checking provider:", provider.provider);

            console.log("[CapabilityFilter] Checking provider:", {
                provider: provider.provider,
                enabled: provider.enabled,
                healthy: HealthMonitor.isHealthy(provider.provider),
                supportsChat: provider.supportsChat,
                supportsCoding: provider.supportsCoding,
                supportsVision: provider.supportsVision,
                supportsReasoning: provider.supportsReasoning,
                taskType,
            });

            if (!provider.enabled) {
                console.log(`[CapabilityFilter] REJECT ${provider.provider}: disabled`);
                return false;
            }

            if (!HealthMonitor.isHealthy(provider.provider)) {
                console.log(`[CapabilityFilter] REJECT ${provider.provider}: unhealthy`);
                return false;
            }

            let supported = false;

            switch (taskType) {

                case TaskType.CHAT:
                    supported = provider.supportsChat;
                    break;

                case TaskType.CODE:
                    supported = provider.supportsCoding;
                    break;

                case TaskType.VISION:
                    supported = provider.supportsVision;
                    break;

                case TaskType.REASONING:
                    supported = provider.supportsReasoning;
                    break;

                case TaskType.SUMMARIZATION:
                    supported = provider.supportsChat;
                    break;

                case TaskType.TRANSLATION:
                    supported = provider.supportsChat;
                    break;

                case TaskType.CLASSIFICATION:
                    supported = provider.supportsChat;
                    break;

                case TaskType.SEARCH:
                    supported = provider.supportsChat;
                    break;

                case TaskType.AGENT:
                    supported = provider.supportsChat;
                    break;

                default:
                    supported = provider.supportsChat;
                    break;
            }

            console.log(
                `[CapabilityFilter] ${provider.provider} supports ${taskType}: ${supported}`
            );

            return supported;
        });
    }
}