import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { HealthMonitor } from "./HealthMonitor";
import { helixLogger } from "../config/logger";

export class FailoverEngine {
    public static getNextProvider(
        providers: ProviderCapabilities[],
        currentProvider: string
    ): ProviderCapabilities | null {
        if (!providers.length) {
            return null;
        }

        const candidates = providers.filter(
            provider =>
                provider.provider !== currentProvider &&
                provider.enabled &&
                HealthMonitor.isHealthy(provider.provider)
        );

        if (candidates.length === 0) {
            helixLogger.warn("No failover provider available", {
                currentProvider,
            });

            return null;
        }

        candidates.sort((a, b) => a.priority - b.priority);

        const nextProvider = candidates[0];

        helixLogger.warn("Provider failover triggered", {
            from: currentProvider,
            to: nextProvider.provider,
        });

        return nextProvider;
    }
}