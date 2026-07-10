import { ProviderType } from "../types/ProviderType";

interface ProviderMetrics {
    usage: number;
    successes: number;
    failures: number;
    totalLatency: number;
    averageLatency: number;
}

interface MetricsSnapshot {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    retryCount: number;
    failoverCount: number;
    averageLatency: number;
    totalLatency: number;
    providerMetrics: Record<ProviderType, ProviderMetrics>;
}

export class MetricsManager {

    private static totalRequests = 0;
    private static successfulRequests = 0;
    private static failedRequests = 0;

    private static retryCount = 0;
    private static failoverCount = 0;

    private static totalLatency = 0;

    private static providerMetrics: Record<ProviderType, ProviderMetrics> = {

        [ProviderType.GEMINI]: {
            usage: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            averageLatency: 0,
        },

        [ProviderType.OPENROUTER]: {
            usage: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            averageLatency: 0,
        },
    };

    static recordRequest(): void {
        this.totalRequests++;
    }

    static recordSuccess(
        provider: ProviderType,
        latency: number
    ): void {

        this.successfulRequests++;
        this.totalLatency += latency;

        const metrics = this.providerMetrics[provider];

        metrics.usage++;
        metrics.successes++;
        metrics.totalLatency += latency;
        metrics.averageLatency =
            metrics.totalLatency / metrics.usage;
    }

    static recordFailure(
        provider: ProviderType,
        latency: number
    ): void {

        this.failedRequests++;
        this.totalLatency += latency;

        const metrics = this.providerMetrics[provider];

        metrics.usage++;
        metrics.failures++;
        metrics.totalLatency += latency;
        metrics.averageLatency =
            metrics.totalLatency / metrics.usage;
    }

    static recordRetry(): void {
        this.retryCount++;
    }

    static recordFailover(): void {
        this.failoverCount++;
    }

    static getProviderMetrics(
        provider: ProviderType
    ): ProviderMetrics {

        return structuredClone(
            this.providerMetrics[provider]
        );
    }

    static getMetrics(): MetricsSnapshot {

        const completed =
            this.successfulRequests +
            this.failedRequests;

        return {

            totalRequests: this.totalRequests,

            successfulRequests: this.successfulRequests,

            failedRequests: this.failedRequests,

            retryCount: this.retryCount,

            failoverCount: this.failoverCount,

            totalLatency: this.totalLatency,

            averageLatency:
                completed === 0
                    ? 0
                    : this.totalLatency / completed,

            providerMetrics:
                structuredClone(this.providerMetrics),
        };
    }

    static reset(): void {

        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;

        this.retryCount = 0;
        this.failoverCount = 0;

        this.totalLatency = 0;

        this.providerMetrics = {

            [ProviderType.GEMINI]: {
                usage: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0,
                averageLatency: 0,
            },

            [ProviderType.OPENROUTER]: {
                usage: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0,
                averageLatency: 0,
            },
        };
    }
}