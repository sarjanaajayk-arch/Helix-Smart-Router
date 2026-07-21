import { ChatMessage, ChatResponse } from "../providers/AIProvider";
import { helixLogger } from "../config/logger";

interface OpenAIUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface OpenAIChatChoice {
    index: number;
    message: {
        role: "assistant";
        content: string;
    };
    finish_reason: string;
}

interface OpenAIChatResponse {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: OpenAIChatChoice[];
    usage?: OpenAIUsage;
}

export interface ValidationResult<T> {
    valid: boolean;
    error?: string;
    sanitizedResponse?: T;
}

export class OutputValidator {
    /**
     * Validates a chat response from a provider
     * Ensures the response meets OpenAI-compatible format requirements
     */
    static validateChatResponse(
        response: ChatResponse,
        providerName: string,
        originalMessages: ChatMessage[]
    ): ValidationResult<ChatResponse> {
        // Check response exists
        if (!response) {
            helixLogger.warn("Output validation failed: null response", { provider: providerName });
            return {
                valid: false,
                error: "Provider returned null response",
            };
        }

        // Check content exists and is a string
        if (typeof response.content !== "string") {
            helixLogger.warn("Output validation failed: content is not a string", {
                provider: providerName,
                contentType: typeof response.content,
            });
            return {
                valid: false,
                error: "Provider response content must be a string",
            };
        }

        // Check content is not empty (unless it's a valid empty response for certain cases)
        if (response.content.length === 0) {
            helixLogger.warn("Output validation warning: empty response content", {
                provider: providerName,
            });
            // Allow empty content but sanitize it
        }

        // Sanitize content - remove null bytes and control characters except newlines/tabs
        const sanitizedContent = response.content
            .replace(/\0/g, "") // Remove null bytes
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Remove other control chars

        // Check provider name
        if (!response.provider || typeof response.provider !== "string") {
            helixLogger.warn("Output validation warning: missing or invalid provider name", {
                provider: providerName,
                responseProvider: response.provider,
            });
        }

        // Check model name
        if (!response.model || typeof response.model !== "string") {
            helixLogger.warn("Output validation warning: missing or invalid model name", {
                provider: providerName,
                model: response.model,
            });
        }

        // Validate content length isn't suspiciously large (> 10MB)
        if (sanitizedContent.length > 10 * 1024 * 1024) {
            helixLogger.warn("Output validation warning: extremely large response", {
                provider: providerName,
                contentLength: sanitizedContent.length,
            });
        }

        // Sanitize the response
        const sanitizedResponse: ChatResponse = {
            content: sanitizedContent,
            provider: response.provider || providerName,
            model: response.model || "unknown",
        };

        // Log validation success
        helixLogger.debug("Output validation passed", {
            provider: providerName,
            contentLength: sanitizedContent.length,
            model: sanitizedResponse.model,
        });

        return {
            valid: true,
            sanitizedResponse,
        };
    }

    /**
     * Validates a streaming chunk
     */
    static validateStreamChunk(
        chunk: string,
        providerName: string
    ): ValidationResult<string> {
        if (typeof chunk !== "string") {
            return {
                valid: false,
                error: "Stream chunk must be a string",
            };
        }

        // Sanitize chunk
        const sanitized = chunk
            .replace(/\0/g, "")
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

        return {
            valid: true,
            sanitizedResponse: sanitized,
        };
    }

    /**
     * Validates an OpenAI-compatible chat completion response
     */
    static validateOpenAIResponse(
        response: Record<string, unknown>,
        providerName: string
    ): ValidationResult<OpenAIChatResponse> {
        if (!response || typeof response !== "object") {
            return {
                valid: false,
                error: "Response must be an object",
            };
        }

        // Check required OpenAI fields
        if (!response.id || typeof response.id !== "string") {
            return {
                valid: false,
                error: "Response missing required 'id' field",
            };
        }

        if (!response.object || response.object !== "chat.completion") {
            return {
                valid: false,
                error: "Response 'object' must be 'chat.completion'",
            };
        }

        if (!response.created || typeof response.created !== "number") {
            return {
                valid: false,
                error: "Response missing required 'created' timestamp",
            };
        }

        if (!response.model || typeof response.model !== "string") {
            return {
                valid: false,
                error: "Response missing required 'model' field",
            };
        }

        if (!Array.isArray(response.choices) || response.choices.length === 0) {
            return {
                valid: false,
                error: "Response must have at least one choice",
            };
        }

        // Validate first choice
        const choice = response.choices[0];
        if (!choice || typeof choice !== "object") {
            return {
                valid: false,
                error: "First choice must be an object",
            };
        }

        if (typeof choice.index !== "number") {
            return {
                valid: false,
                error: "Choice missing required 'index' field",
            };
        }

        if (!choice.message || typeof choice.message !== "object") {
            return {
                valid: false,
                error: "Choice missing required 'message' object",
            };
        }

        const message = choice.message as Record<string, unknown>;
        if (message.role !== "assistant") {
            return {
                valid: false,
                error: "Message role must be 'assistant'",
            };
        }

        if (typeof message.content !== "string") {
            return {
                valid: false,
                error: "Message content must be a string",
            };
        }

        if (!choice.finish_reason || typeof choice.finish_reason !== "string") {
            return {
                valid: false,
                error: "Choice missing required 'finish_reason'",
            };
        }

        // Validate usage if present
        if (response.usage) {
            const usage = response.usage as Record<string, unknown>;
            if (
                typeof usage.prompt_tokens !== "number" ||
                typeof usage.completion_tokens !== "number" ||
                typeof usage.total_tokens !== "number"
            ) {
                return {
                    valid: false,
                    error: "Usage object must have numeric prompt_tokens, completion_tokens, and total_tokens",
                };
            }
        }

        return {
            valid: true,
            sanitizedResponse: response as unknown as OpenAIChatResponse,
        };
    }
}