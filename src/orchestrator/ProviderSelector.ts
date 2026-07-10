import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";
import { CapabilityFilter } from "./CapabilityFilter";

export class ProviderSelector {

    public static select(
        providers: ProviderCapabilities[],
        taskType: TaskType
    ): ProviderCapabilities {

        const availableProviders = CapabilityFilter.filter(
            providers,
            taskType
        );

        if (availableProviders.length === 0) {
            throw new Error("No compatible AI providers available.");
        }

        availableProviders.sort((a, b) => {

            // Higher priority wins
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            // Lower latency wins
            if (a.estimatedLatency !== b.estimatedLatency) {
                return a.estimatedLatency - b.estimatedLatency;
            }

            // Lower cost wins
            return (
                a.costPerMillionInputTokens -
                b.costPerMillionInputTokens
            );

        });

        return availableProviders[0];
    }

}