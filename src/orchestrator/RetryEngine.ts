import { RetryConfig } from "../config/RetryConfig";
import { MetricsManager } from "../metrics/MetricsManager";
import { helixLogger } from "../config/logger";

export class RetryEngine {

    public static async execute<T>(
        operation: () => Promise<T>,
        retries: number = RetryConfig.maxRetries,
        delay: number = RetryConfig.initialDelayMs
    ): Promise<T> {

        let lastError: unknown;

        let currentDelay = delay;

        for (let attempt = 1; attempt <= retries; attempt++) {

            try {

                const result = await operation();

                if (attempt > 1) {
                    helixLogger.info("Retry Succeeded", {
                        retryAttempt: attempt,
                    });
                }

                return result;

            } catch (error) {

                lastError = error;

                if (attempt < retries) {

                    MetricsManager.recordRetry();

                    helixLogger.warn("Retry Attempt", {
                        retryAttempt: attempt,
                        retryDelay: currentDelay,
                    });

                    await new Promise(resolve =>
                        setTimeout(resolve, currentDelay)
                    );

                    currentDelay = Math.min(
                        currentDelay * RetryConfig.backoffMultiplier,
                        RetryConfig.maxDelayMs
                    );

                } else {

                    helixLogger.error(
                        "Retry Failed",
                        error,
                        {
                            retryAttempt: attempt,
                        }
                    );

                }

            }

        }

        throw lastError;

    }

}