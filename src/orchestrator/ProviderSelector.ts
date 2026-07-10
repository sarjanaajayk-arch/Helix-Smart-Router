import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";

import { CapabilityFilter } from "./CapabilityFilter";
import { ProviderScorer } from "./ProviderScorer";

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

        let bestProvider = availableProviders[0];
        let bestScore = ProviderScorer.calculateScore(bestProvider);

        for (const provider of availableProviders.slice(1)) {

            const score = ProviderScorer.calculateScore(provider);

            if (score > bestScore) {
                bestScore = score;
                bestProvider = provider;
            }
        }

        return bestProvider;
    }

}