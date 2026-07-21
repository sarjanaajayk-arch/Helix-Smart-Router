import { helixLogger } from "../config/logger";
import { ProviderType } from "../types/ProviderType";

export interface OpenAIErrorResponse {
    error: {
        message: string;
        type: string;
        param?: string | null;
        code?: string | null;
    };
}

export interface NormalizedError extends Error {
    statusCode: number;
    openAIError: OpenAIErrorResponse;
    originalError: Error | unknown;
    provider: ProviderType;
}

/**
 * Normalizes provider-specific errors to OpenAI-compatible error format
 * This ensures consistent error responses across all providers
 */
export class ErrorNormalizer {
    /**
     * Normalizes an error from any provider to OpenAI-compatible format
     */
    static normalize(error: Error | unknown, provider: ProviderType): NormalizedError {
        const originalError = error instanceof Error ? error : new Error(String(error));

        // Default error
        let statusCode = 500;
        let openAIType = "internal_error";
        let openAICode: string | null = "internal_error";
        let openAIMessage = "An internal server error occurred";
        let param: string | null = null;

        // Handle provider-specific errors
        if (provider === ProviderType.GEMINI) {
            const normalized = this.normalizeGeminiError(originalError);
            statusCode = normalized.statusCode;
            openAIType = normalized.type;
            openAICode = normalized.code;
            openAIMessage = normalized.message;
            param = normalized.param;
        } else if (provider === ProviderType.OPENROUTER) {
            const normalized = this.normalizeOpenRouterError(originalError);
            statusCode = normalized.statusCode;
            openAIType = normalized.type;
            openAICode = normalized.code;
            openAIMessage = normalized.message;
            param = normalized.param;
        } else if (error instanceof Error) {
            // Generic error handling for other providers
            const normalized = this.normalizeGenericError(originalError);
            statusCode = normalized.statusCode;
            openAIType = normalized.type;
            openAICode = normalized.code;
            openAIMessage = normalized.message;
            param = normalized.param;
        }

        const normalizedError: NormalizedError = Object.assign(new Error(openAIMessage), {
            statusCode,
            openAIError: {
                error: {
                    message: openAIMessage,
                    type: openAIType,
                    param,
                    code: openAICode,
                }
            },
            originalError: error,
            provider,
        });

        helixLogger.debug("Error normalized", {
            provider,
            originalMessage: originalError.message,
            normalizedType: openAIType,
            normalizedCode: openAICode,
            statusCode,
        });

        return normalizedError;
    }

    /**
     * Normalizes Google Gemini errors to OpenAI format
     */
    private static normalizeGeminiError(error: Error): {
        statusCode: number;
        type: string;
        code: string | null;
        message: string;
        param: string | null;
    } {
        const message = error.message || "Unknown Gemini error";

        // Check for specific Gemini error patterns
        if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
            return {
                statusCode: 401,
                type: "authentication_error",
                code: "invalid_api_key",
                message: "Invalid API key provided",
                param: "api_key",
            };
        }

        if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
            return {
                statusCode: 403,
                type: "permission_error",
                code: "access_denied",
                message: "Access denied. Check API key permissions.",
                param: null,
            };
        }

        if (message.includes("QUOTA_EXCEEDED") || message.includes("quota") || message.includes("429")) {
            return {
                statusCode: 429,
                type: "rate_limit_error",
                code: "rate_limit_exceeded",
                message: "Rate limit exceeded. Please try again later.",
                param: null,
            };
        }

        if (message.includes("INVALID_ARGUMENT") || message.includes("400")) {
            return {
                statusCode: 400,
                type: "invalid_request_error",
                code: "invalid_request",
                message: `Invalid request: ${message}`,
                param: "request",
            };
        }

        if (message.includes("NOT_FOUND") || message.includes("404")) {
            return {
                statusCode: 404,
                type: "not_found_error",
                code: "model_not_found",
                message: "The requested model was not found",
                param: "model",
            };
        }

        if (message.includes("DEADLINE_EXCEEDED") || message.includes("timeout")) {
            return {
                statusCode: 408,
                type: "timeout_error",
                code: "request_timeout",
                message: "Request timed out. Please try again.",
                param: null,
            };
        }

        if (message.includes("UNAVAILABLE") || message.includes("503") || message.includes("overloaded")) {
            return {
                statusCode: 503,
                type: "server_error",
                code: "service_unavailable",
                message: "Service temporarily unavailable. Please try again.",
                param: null,
            };
        }

        if (message.includes("INTERNAL") || message.includes("500")) {
            return {
                statusCode: 500,
                type: "server_error",
                code: "internal_error",
                message: "Internal server error. Please try again later.",
                param: null,
            };
        }

        // Default to server error for unknown Gemini errors
        return {
            statusCode: 500,
            type: "server_error",
            code: "provider_error",
            message: `Gemini provider error: ${message}`,
            param: null,
        };
    }

    /**
     * Normalizes OpenRouter errors to OpenAI format
     */
    private static normalizeOpenRouterError(error: Error): {
        statusCode: number;
        type: string;
        code: string | null;
        message: string;
        param: string | null;
    } {
        const message = error.message || "Unknown OpenRouter error";

        // OpenRouter often returns OpenAI-compatible errors already
        // But we normalize to ensure consistency

        if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid api key")) {
            return {
                statusCode: 401,
                type: "authentication_error",
                code: "invalid_api_key",
                message: "Invalid API key provided",
                param: "api_key",
            };
        }

        if (message.includes("403") || message.includes("Forbidden")) {
            return {
                statusCode: 403,
                type: "permission_error",
                code: "access_denied",
                message: "Access denied. Check your API key permissions.",
                param: null,
            };
        }

        if (message.includes("429") || message.includes("rate limit") || message.includes("Too Many Requests")) {
            return {
                statusCode: 429,
                type: "rate_limit_error",
                code: "rate_limit_exceeded",
                message: "Rate limit exceeded. Please try again later.",
                param: null,
            };
        }

        if (message.includes("400") || message.includes("Bad Request")) {
            return {
                statusCode: 400,
                type: "invalid_request_error",
                code: "invalid_request",
                message: `Invalid request: ${message}`,
                param: "request",
            };
        }

        if (message.includes("404") || message.includes("Not Found") || message.includes("model not found")) {
            return {
                statusCode: 404,
                type: "not_found_error",
                code: "model_not_found",
                message: "The requested model was not found",
                param: "model",
            };
        }

        if (message.includes("408") || message.includes("timeout") || message.includes("Timeout")) {
            return {
                statusCode: 408,
                type: "timeout_error",
                code: "request_timeout",
                message: "Request timed out. Please try again.",
                param: null,
            };
        }

        if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
            return {
                statusCode: 503,
                type: "server_error",
                code: "service_unavailable",
                message: "Service temporarily unavailable. Please try again.",
                param: null,
            };
        }

        // Default
        return {
            statusCode: 500,
            type: "server_error",
            code: "provider_error",
            message: `OpenRouter provider error: ${message}`,
            param: null,
        };
    }

    /**
         * Normalizes generic errors (network, timeout, etc.)
         */
        private static normalizeGenericError(error: Error): {
            statusCode: number;
            type: string;
            code: string | null;
            message: string;
            param: string | null;
        } {
            const message = error.message || "Unknown error";

            // Timeout errors (must come first since ETIMEDOUT can match both)
            if (
                message.includes("timeout") ||
                message.includes("ETIMEDOUT") ||
                message.includes("AbortError") ||
                error.name === "TimeoutError"
            ) {
                return {
                    statusCode: 408,
                    type: "timeout_error",
                    code: "request_timeout",
                    message: "Request timed out. Please try again.",
                    param: null,
                };
            }

            // Network/connection errors
            if (
                message.includes("ECONNREFUSED") ||
                message.includes("ENOTFOUND") ||
                message.includes("EAI_AGAIN") ||
                message.includes("ETIMEDOUT") ||
                message.includes("network") ||
                message.includes("fetch failed") ||
                message.includes("ENOTFOUND") ||
                message.includes("ENETUNREACH")
            ) {
                return {
                    statusCode: 503,
                    type: "server_error",
                    code: "service_unavailable",
                    message: "Unable to connect to provider. Service may be unavailable.",
                    param: null,
                };
            }

            // TLS/SSL errors
            if (
                message.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE") ||
                message.includes("CERTIFICATE_VERIFY_FAILED") ||
                message.includes("SSL") ||
                message.includes("TLS")
            ) {
                return {
                    statusCode: 503,
                    type: "server_error",
                    code: "service_unavailable",
                    message: "TLS/SSL verification failed. Service may be unavailable.",
                    param: null,
                };
            }

            // Rate limit errors (generic)
            if (
                message.includes("rate limit") ||
                message.includes("rate limit exceeded") ||
                message.includes("429") ||
                message.includes("Too Many Requests")
            ) {
                return {
                    statusCode: 429,
                    type: "rate_limit_error",
                    code: "rate_limit_exceeded",
                    message: "Rate limit exceeded. Please try again later.",
                    param: null,
                };
            }

            // Validation errors (must come after rate limit check)
            if (
                message.includes("validation") ||
                (message.includes("invalid") && !message.includes("rate limit")) ||
                error.name === "ValidationError"
            ) {
                return {
                    statusCode: 400,
                    type: "invalid_request_error",
                    code: "invalid_request",
                    message: `Invalid request: ${message}`,
                    param: "request",
                };
            }

            // Default to server error
            return {
                statusCode: 500,
                type: "server_error",
                code: "internal_error",
                message: `Internal error: ${message}`,
                param: null,
            };
        }

    /**
     * Creates a standard OpenAI-compatible error response object
     */
    static createErrorResponse(normalizedError: NormalizedError): OpenAIErrorResponse {
        return normalizedError.openAIError;
    }

    /**
     * Creates an error response with request ID for tracing
     */
    static createErrorResponseWithRequestId(
        normalizedError: NormalizedError,
        requestId?: string
    ): OpenAIErrorResponse & { request_id?: string } {
        const response = this.createErrorResponse(normalizedError);
        if (requestId) {
            return { ...response, request_id: requestId };
        }
        return response;
    }
}