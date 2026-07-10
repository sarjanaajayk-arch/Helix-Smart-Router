import { ProviderCapabilities } from "../models/ProviderCapabilities";

export class ProviderScorer {

    public static calculateScore(
        provider: ProviderCapabilities
    ): number {

        let score = 0;

        // Higher priority is better
        score += (100 - provider.priority) * 5;

        // Lower latency is better
        score += Math.max(0, 1000 - provider.estimatedLatency) / 10;

        // Lower cost is better
        score += Math.max(0, 100 - provider.costPerMillionInputTokens);

        // Larger context window is better
        score += provider.maxContextWindow / 100000;

        return score;
    }
}