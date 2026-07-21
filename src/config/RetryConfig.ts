export const RetryConfig = {
    maxRetries: 3,

    initialDelayMs: 500,

    maxDelayMs: 5_000,

    backoffMultiplier: 2,

    retryableStatusCodes: [
        408,
        429,
        500,
        502,
        503,
        504,
    ],
};