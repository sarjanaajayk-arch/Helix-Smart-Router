import { ProviderType } from "../types/ProviderType";

type HealthStatus = {
    healthy: boolean;
    lastFailure?: Date;
    failureCount: number;
};

export class HealthMonitor {

    private static readonly MAX_FAILURES = 3;

    private static readonly COOLDOWN_MS = 60 * 1000;

    private static readonly health = new Map<ProviderType, HealthStatus>();

    static initialize(providers: ProviderType[]) {

        providers.forEach(provider => {

            this.health.set(provider, {
                healthy: true,
                failureCount: 0,
            });

        });

    }

    static recordSuccess(provider: ProviderType) {

        this.health.set(provider, {
            healthy: true,
            failureCount: 0,
        });

    }

    static recordFailure(provider: ProviderType) {

        const current = this.health.get(provider);

        if (!current) {
            return;
        }

        current.failureCount++;

        current.lastFailure = new Date();

        if (current.failureCount >= this.MAX_FAILURES) {
            current.healthy = false;
        }

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

        const elapsed =
            Date.now() - current.lastFailure.getTime();

        if (elapsed >= this.COOLDOWN_MS) {

            current.healthy = true;

            current.failureCount = 0;

            return true;

        }

        return false;

    }

}