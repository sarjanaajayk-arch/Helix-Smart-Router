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

                const isRetryable = RetryEngine.isRetryableError(error);

                if (attempt < retries && isRetryable) {

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

    private static isRetryableError(error: unknown): boolean {
        // If error is an ApiError with a status code, check against retryable status codes
        if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (typeof status === 'number') {
                return RetryConfig.retryableStatusCodes.includes(status);
            }
        }
        // Also check for common error properties like 'code' or 'statusCode'
        if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as any).code;
            if (typeof code === 'number') {
                return RetryConfig.retryableStatusCodes.includes(code);
            }
        }
        // If no status/code, we assume it's not an HTTP error and retry (preserving existing behavior for unit tests)
        // This ensures that errors thrown in unit tests (like string errors) are still retried.
        return true;
    }

}