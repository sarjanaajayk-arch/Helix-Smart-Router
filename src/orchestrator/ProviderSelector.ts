import { ProviderCapabilities } from "../models/ProviderCapabilities";

export class ProviderSelector {
    public static select(
        providers: ProviderCapabilities[]
    ): ProviderCapabilities {
        const availableProviders = providers.filter(
            (provider) => provider.enabled && provider.healthy
        );

        if (availableProviders.length === 0) {
            throw new Error("No healthy AI providers available.");
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

            // Lower input cost wins
            return (
                a.costPerMillionInputTokens -
                b.costPerMillionInputTokens
            );
        });

        return availableProviders[0];
    }
}