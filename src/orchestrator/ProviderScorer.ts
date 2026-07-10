import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { RouterConfig } from "../config/RouterConfig";

export class ProviderScorer {

    public static calculateScore(
        provider: ProviderCapabilities
    ): number {

        let score = 0;

        const weights = RouterConfig.routingWeights;

        // Higher priority is better
        score += ((100 - provider.priority) * weights.priority) / 20;

        // Lower latency is better
        score +=
            (Math.max(0, 1000 - provider.estimatedLatency) / 1000)
            * weights.latency;

        // Lower cost is better
        score +=
            (Math.max(0, 100 - provider.costPerMillionInputTokens) / 100)
            * weights.cost;

        // Larger context window is better
        score +=
            (provider.maxContextWindow / 1000000)
            * weights.reasoning;

        return score;
    }
}