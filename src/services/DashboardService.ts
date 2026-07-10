import { MetricsManager } from "../metrics/MetricsManager";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";

export class DashboardService {
    static getDashboard() {
        const metrics = MetricsManager.getMetrics();

        const providers = PROVIDERS.map((provider) => ({
            provider: provider.provider,

            healthy: HealthMonitor.isHealthy(provider.provider),

            enabled: provider.enabled,

            priority: provider.priority,

            estimatedLatency: provider.estimatedLatency,

            maxContextWindow: provider.maxContextWindow,

            features: {
                chat: provider.supportsChat,
                vision: provider.supportsVision,
                coding: provider.supportsCoding,
                reasoning: provider.supportsReasoning,
                streaming: provider.supportsStreaming,
                longContext: provider.supportsLongContext,
            },
        }));

        return {
            timestamp: new Date().toISOString(),

            summary: {
                totalProviders: providers.length,
                healthyProviders: providers.filter(
                    (p) => p.healthy
                ).length,
                unhealthyProviders: providers.filter(
                    (p) => !p.healthy
                ).length,
            },

            metrics,

            providers,
        };
    }
}