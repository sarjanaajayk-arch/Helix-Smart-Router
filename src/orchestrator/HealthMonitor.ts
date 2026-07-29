import { RetryConfig } from "../config/RetryConfig";
import { TimeoutConfig } from "../config/TimeoutConfig";
import { helixLogger } from "../config/logger";
import { ProviderType } from "../types/ProviderType";

type HealthStatus = {
    healthy: boolean;
    lastFailure?: Date;
    failureCount: number;
};

export class HealthMonitor {
    private static readonly MAX_FAILURES = RetryConfig.maxRetries;
    private static readonly COOLDOWN_MS = TimeoutConfig.requestTimeoutMs;
    private static readonly health = new Map<ProviderType, HealthStatus>();

    static initialize(providers: ProviderType[]): void {
        for (const provider of providers) {
            if (!this.health.has(provider)) {
                this.health.set(provider, {
                    healthy: true,
                    failureCount: 0,
                });
            }
        }
    }

    static recordSuccess(provider: ProviderType): void {
        this.health.set(provider, {
            healthy: true,
            failureCount: 0,
            lastFailure: undefined,
        });

        helixLogger.debug("Provider marked healthy", { provider });
    }

    static recordFailure(provider: ProviderType): void {
        const current =
            this.health.get(provider) ?? {
                healthy: true,
                failureCount: 0,
            };

        current.failureCount += 1;
        current.lastFailure = new Date();

        if (current.failureCount >= this.MAX_FAILURES) {
            current.healthy = false;
            helixLogger.warn("Provider marked unhealthy", {
                provider,
                failureCount: current.failureCount,
            });
        } else {
            helixLogger.warn("Provider failure recorded", {
                provider,
                failureCount: current.failureCount,
            });
        }

        this.health.set(provider, current);
    }

    static isHealthy(provider: ProviderType): boolean {
        const current = this.health.get(provider);

        if (!current) {
            return false;
        }

        if (current.healthy) {
            return true;
        }

        if (!current.lastFailure) {
            return false;
        }

        const elapsed = Date.now() - current.lastFailure.getTime();

        if (elapsed >= this.COOLDOWN_MS) {
            current.healthy = true;
            current.failureCount = 0;
            current.lastFailure = undefined;

            this.health.set(provider, current);

            helixLogger.info("Provider recovered after cooldown", {
                provider,
            });

            return true;
        }

        return false;
    }

    static getStatus(provider: ProviderType): HealthStatus | null {
        const status = this.health.get(provider);
        return status ? { ...status } : null;
    }
}