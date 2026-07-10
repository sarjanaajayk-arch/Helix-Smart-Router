import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { RouterConfig } from "../config/RouterConfig";
import { RoutingExplanation } from "../models/RoutingExplanation";

export class ProviderScorer {

    public static calculateScore(
        provider: ProviderCapabilities
    ): number {

        const weights = RouterConfig.routingWeights;

        let score = 0;

        score += ((100 - provider.priority) * weights.priority) / 20;

        score +=
            (Math.max(0, 1000 - provider.estimatedLatency) / 1000)
            * weights.latency;

        score +=
            (Math.max(0, 100 - provider.costPerMillionInputTokens) / 100)
            * weights.cost;

        score +=
            (provider.maxContextWindow / 1000000)
            * weights.reasoning;

        return score;
    }

    public static buildExplanation(
        provider: ProviderCapabilities,
        model: string,
        policy: string
    ): RoutingExplanation {

        const weights = RouterConfig.routingWeights;

        const priority =
            ((100 - provider.priority) * weights.priority) / 20;

        const latency =
            (Math.max(0, 1000 - provider.estimatedLatency) / 1000)
            * weights.latency;

        const cost =
            (Math.max(0, 100 - provider.costPerMillionInputTokens) / 100)
            * weights.cost;

        const context =
            (provider.maxContextWindow / 1000000)
            * weights.reasoning;

        const totalScore =
            priority +
            latency +
            cost +
            context;

        return {
            provider: provider.provider,
            model,
            policy,
            totalScore,
            breakdown: {
                priority,
                capability: 0,
                cost,
                latency,
                context,
            },
        };
    }
}