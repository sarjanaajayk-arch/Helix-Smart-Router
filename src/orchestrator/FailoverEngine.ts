import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { HealthMonitor } from "./HealthMonitor";

export class FailoverEngine {

    public static getNextProvider(
        providers: ProviderCapabilities[],
        currentProvider: string
    ): ProviderCapabilities | null {

        const candidates = providers.filter(
            provider =>
                provider.provider !== currentProvider &&
                provider.enabled &&
                HealthMonitor.isHealthy(provider.provider)
        );

        if (candidates.length === 0) {
            return null;
        }

        candidates.sort((a, b) => a.priority - b.priority);

        return candidates[0];
    }

}