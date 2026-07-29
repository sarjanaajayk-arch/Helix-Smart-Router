import { TimeoutConfig } from "../config/TimeoutConfig";
import { helixLogger } from "../config/logger";

export class TimeoutWrapper {
    /**
     * Wraps a promise with a timeout.
     * @param promise The promise to wrap
     * @param timeoutMs Timeout in milliseconds
     * @param operationName Name for logging
     * @returns The resolved value of the promise
     * @throws Error if timeout is exceeded
     */
    static async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number = TimeoutConfig.providerTimeoutMs,
        operationName: string = "Operation"
    ): Promise<T> {
        let timeoutId: NodeJS.Timeout;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });

       try {
    return await Promise.race([promise, timeoutPromise]);
} finally {
    clearTimeout(timeoutId!);
}
    }

    /**
     * Wraps an async generator with a timeout.
     * @param generator Async generator to wrap
     * @param timeoutMs Total timeout for the entire stream
     * @param operationName Name for logging
     * @returns Async generator that yields items with timeout enforcement
     */
    static async *withStreamTimeout<T>(
        generator: AsyncGenerator<T>,
        timeoutMs: number = TimeoutConfig.streamingTimeoutMs,
        operationName: string = "Stream"
    ): AsyncGenerator<T> {
        const startTime = Date.now();
        
        for await (const item of generator) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= timeoutMs) {
                helixLogger.warn(`${operationName} stream timeout reached`, {
                    elapsedMs: elapsed,
                    timeoutMs,
                });
                throw new Error(`${operationName} stream timed out after ${timeoutMs}ms`);
            }
            yield item;
        }
    }

    /**
     * Creates a timeout promise that rejects after specified ms.
     * Useful for Promise.race patterns.
     */
    static createTimeoutPromise<T = never>(
        timeoutMs: number,
        operationName: string = "Operation"
    ): Promise<T> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });
    }
}