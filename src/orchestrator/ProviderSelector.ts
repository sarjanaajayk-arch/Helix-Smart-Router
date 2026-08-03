import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { TaskType } from "../types/TaskType";

import { CapabilityFilter } from "./CapabilityFilter";
import { ProviderScorer } from "./ProviderScorer";

export class ProviderSelector {

    public static select(
    providers: ProviderCapabilities[],
    taskType: TaskType
): ProviderCapabilities {

    console.log("=================================");
    console.log("ProviderSelector.select()");
    console.log("TaskType:", taskType);
    console.log("Providers:", providers);

    const availableProviders = CapabilityFilter.filter(
        providers,
        taskType
    );

    console.log("Available Providers:", availableProviders);

    if (availableProviders.length === 0) {
        console.log("❌ ZERO PROVIDERS AFTER FILTER");
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

    console.log("✅ Selected Provider:", bestProvider.provider);

    return bestProvider;
}
}