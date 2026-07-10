import { MetricsManager } from "../metrics/MetricsManager";
import { ModelRegistryService } from "../registry/ModelRegistryService";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";

export class DashboardService {
    static getDashboard() {
        const metrics = MetricsManager.getMetrics();
        const providers = this.getProviders(metrics);

        return {
            timestamp: new Date().toISOString(),

            summary: {
                totalProviders: providers.length,
                healthyProviders: providers.filter((p) => p.healthy).length,
                unhealthyProviders: providers.filter((p) => !p.healthy).length,
            },

            metrics,

            providers,
        };
    }

    static getModels() {
        const metrics = MetricsManager.getMetrics();

        const providerLookup = new Map(
            PROVIDERS.map((provider) => [provider.provider, provider] as const)
        );

        return ModelRegistryService.getAllModels().map((model) => {
            const provider = providerLookup.get(model.provider);
            const providerMetrics = metrics.providerMetrics[model.provider];

            const usage = providerMetrics?.usage ?? 0;
            const successes = providerMetrics?.successes ?? 0;
            const failures = providerMetrics?.failures ?? 0;
            const averageLatency = providerMetrics?.averageLatency ?? 0;
            const successRate = usage === 0 ? 0 : (successes / usage) * 100;

            const providerHealthy = provider
                ? HealthMonitor.isHealthy(provider.provider)
                : false;

            return {
                id: model.id,
                name: model.name,
                provider: model.provider,
                contextWindow: model.contextWindow,
                maxOutputTokens: model.maxOutputTokens,
                priority: model.priority,
                enabled: model.enabled,

                available: model.enabled && providerHealthy,
                providerHealthy,
                providerEstimatedLatency: provider?.estimatedLatency ?? 0,

                usage,
                successes,
                failures,
                successRate,
                averageLatency,

                retryCount: metrics.retryCount,
                failoverCount: metrics.failoverCount,

                inputPricePerMillionTokens:
                    model.inputPricePerMillionTokens,

                outputPricePerMillionTokens:
                    model.outputPricePerMillionTokens,

                capabilities: model.capabilities,
            };
        });
    }

    static getHealth() {
        const metrics = MetricsManager.getMetrics();
        const providers = this.getProviders(metrics);
        const models = this.getModels();

        return {
            timestamp: new Date().toISOString(),

            summary: {
                totalProviders: providers.length,
                healthyProviders: providers.filter((p) => p.healthy).length,
                unhealthyProviders: providers.filter((p) => !p.healthy).length,
                totalModels: models.length,
                enabledModels: models.filter((m) => m.enabled).length,
                availableModels: models.filter((m) => m.available).length,
            },

            metrics,

            providers,
            models,
        };
    }

    private static getProviders(metrics = MetricsManager.getMetrics()) {
        return PROVIDERS.map((provider) => {
            const providerMetrics = metrics.providerMetrics[provider.provider];

            const usage = providerMetrics?.usage ?? 0;
            const successes = providerMetrics?.successes ?? 0;
            const failures = providerMetrics?.failures ?? 0;
            const averageLatency = providerMetrics?.averageLatency ?? 0;
            const successRate = usage === 0 ? 0 : (successes / usage) * 100;

            return {
                provider: provider.provider,

                healthy: HealthMonitor.isHealthy(provider.provider),

                enabled: provider.enabled,

                priority: provider.priority,

                estimatedLatency: provider.estimatedLatency,

                maxContextWindow: provider.maxContextWindow,

                usage,
                successes,
                failures,
                successRate,
                averageLatency,

                features: {
                    chat: provider.supportsChat,
                    vision: provider.supportsVision,
                    coding: provider.supportsCoding,
                    reasoning: provider.supportsReasoning,
                    streaming: provider.supportsStreaming,
                    longContext: provider.supportsLongContext,
                },
            };
        });
    }
}