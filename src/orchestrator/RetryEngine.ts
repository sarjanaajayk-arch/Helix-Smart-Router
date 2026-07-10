import { RetryConfig } from "../config/RetryConfig";
import { MetricsManager } from "../metrics/MetricsManager";

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

                return await operation();

            } catch (error) {

                lastError = error;

                if (attempt < retries) {

                    MetricsManager.recordRetry();

                    await new Promise(resolve =>
                        setTimeout(resolve, currentDelay)
                    );

                    currentDelay = Math.min(
                        currentDelay * RetryConfig.backoffMultiplier,
                        RetryConfig.maxDelayMs
                    );

                }

            }

        }

        throw lastError;

    }

}