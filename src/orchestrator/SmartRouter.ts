import { TaskType } from "../types/TaskType";
import { RouterConfig } from "../config/RouterConfig";
import { TimeoutConfig } from "../config/TimeoutConfig";
import { RoutingContext } from "../models/RoutingContext";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { ProviderManager } from "../providers/ProviderManager";
import { ProviderType } from "../types/ProviderType";
import { RoutingPolicy } from "../types/RoutingPolicy";
import { usageMeter } from "../services/UsageMeter";
import { normalizeMaxTokens } from "../utils/tokenNormalizer";
import { RoutingRules } from "./RoutingRules";
import { ModelSelector } from "./ModelSelector";
import { CircuitBreaker } from "./CircuitBreaker";
import { RetryEngine } from "./RetryEngine";
import { TimeoutWrapper } from "./TimeoutWrapper";

export class SmartRouter {
    constructor(
        private readonly providerManager: ProviderManager
    ) {}

    /**
     * Converts a RoutingRequest into provider messages.
     */
    private buildMessages(
        request: RoutingRequest
    ): { role: "user"; content: string }[] {
        return [
            {
                role: "user",
                content: request.prompt,
            },
        ];
    }

    /**
     * Estimates the number of tokens in a prompt.
     * Approximation: 1 token ≈ 4 characters.
     */
    private estimateTokens(
        text: string
    ): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Selects the provider for a request.
     */
    private selectProvider(
        request: RoutingRequest
    ): ProviderType {
        console.log(`[SmartRouter] selectProvider: taskType=${request.taskType}, model=${request.model}`);

        if (!RouterConfig.enableSmartRouting) {
            const defaultProvider = RouterConfig.defaultProvider;
            // Check circuit breaker for default provider
            if (!CircuitBreaker.isAvailable(defaultProvider)) {
                throw new Error(`Circuit breaker open for provider: ${defaultProvider}`);
            }
            console.log(`[SmartRouter] SmartRouting disabled, using default provider: ${defaultProvider}`);
            return defaultProvider;
        }

        const selectedProvider = RoutingRules.selectProvider(request.taskType, request.model) as ProviderType;
        console.log(`[SmartRouter] RoutingRules selected provider: ${selectedProvider}`);

        // Check circuit breaker for selected provider
        if (!CircuitBreaker.isAvailable(selectedProvider)) {
            // Try fallback providers
            const providers = RoutingRules.getAllProviders() as ProviderType[];
            for (const provider of providers) {
                if (provider !== selectedProvider && CircuitBreaker.isAvailable(provider)) {
                    console.log(`[SmartRouter] Circuit breaker open for ${selectedProvider}, using fallback: ${provider}`);
                    return provider;
                }
            }
            throw new Error(`Circuit breaker open for all available providers`);
        }

        console.log(`[SmartRouter] Selected provider: ${selectedProvider}`);
        return selectedProvider;
    }

    /**
     * Selects the routing policy for a request.
     * Kept conservative for now to preserve existing behavior.
     */
    private selectPolicy(
        request: RoutingRequest
    ): RoutingPolicy {
        switch (request.taskType) {
            case TaskType.CODE:
                return RoutingPolicy.HIGHEST_QUALITY;

            case TaskType.REASONING:
                return RoutingPolicy.HIGHEST_QUALITY;

            case TaskType.VISION:
                return RoutingPolicy.BALANCED;

            case TaskType.SUMMARIZATION:
                return RoutingPolicy.CHEAPEST;

            case TaskType.TRANSLATION:
                return RoutingPolicy.CHEAPEST;

            case TaskType.CLASSIFICATION:
                return RoutingPolicy.CHEAPEST;

            case TaskType.SEARCH:
                return RoutingPolicy.FASTEST;

            case TaskType.AGENT:
                return RoutingPolicy.BALANCED;

            case TaskType.GENERAL:
                return RoutingPolicy.BALANCED;

            case TaskType.CHAT:
            default:
                return RoutingPolicy.BALANCED;
        }
    }

    /**
     * Routes a normal request.
     */
    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {
        const context: RoutingContext = {
            request,
        };

        console.log(`[SmartRouter.route] Incoming request.model: ${request.model}`);

        context.provider = this.selectProvider(request);

        context.estimatedTokens = this.estimateTokens(request.prompt);

        const policy = this.selectPolicy(request);

        console.log(
            `[SmartRouter.route] After SmartRouter.selectProvider: provider=${context.provider}, policy=${policy}, estimatedTokens=${context.estimatedTokens}, request.model=${request.model}`
        );

        context.selectedModel = ModelSelector.select(
            context.provider!,
            request.taskType,
            context.estimatedTokens,
            policy,
            request.model
        );

        console.log(
            `[SmartRouter.route] After ModelSelector.select: selectedModel=${context.selectedModel}, request.model=${request.model}`
        );

        const normalizedMaxTokens = normalizeMaxTokens(
            context.provider!,
            request.maxTokens,
            undefined
        );

        console.log(`[SmartRouter] maxTokens before normalization: ${request.maxTokens}`);
        console.log(`[SmartRouter] maxTokens after normalization: ${normalizedMaxTokens}`);

        const startTime = Date.now();
        let response: any;
        let error: Error | null = null;

        try {
            response = await RetryEngine.execute(() =>
                TimeoutWrapper.withTimeout(
                    this.providerManager.executeChat(
                        context.provider!,
                        this.buildMessages(request),
                        context.selectedModel!,
                        {
                            maxTokens: normalizedMaxTokens,
                            temperature: request.temperature,
                        }
                    ),
                    TimeoutConfig.providerTimeoutMs,
                    "Provider Chat Request"
                )
            );
        } catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
            throw error;
        } finally {
            const latencyMs = Date.now() - startTime;
            const apiKeyId = request.apiKeyId || "unknown";

            usageMeter.recordRequestUsage({
                requestId: request.requestId || `req-${Date.now()}`,
                apiKeyId,
                provider: context.provider!,
                model: context.selectedModel!,
                prompt: request.prompt,
                response: response?.content || "",
                latencyMs,
                success: !error,
                errorMessage: error?.message,
            });
        }

        return {
            content: response.content,
            provider: response.provider,
            model: response.model,
        };
    }

    /**
     * Routes a streaming request.
     */
    async *routeStream(
        request: RoutingRequest
    ): AsyncGenerator<string> {
        const context: RoutingContext = {
            request,
        };

        console.log(`[SmartRouter.routeStream] Incoming request.model: ${request.model}`);

        context.provider = this.selectProvider(request);

        context.estimatedTokens = this.estimateTokens(request.prompt);

        const policy = this.selectPolicy(request);

        console.log(
            `[SmartRouter.routeStream] After SmartRouter.selectProvider: provider=${context.provider}, policy=${policy}, estimatedTokens=${context.estimatedTokens}, request.model=${request.model}`
        );

        context.selectedModel = ModelSelector.select(
            context.provider!,
            request.taskType,
            context.estimatedTokens,
            policy,
            request.model
        );

        console.log(
            `[SmartRouter.routeStream] After ModelSelector.select: selectedModel=${context.selectedModel}, request.model=${request.model}`
        );

        const normalizedMaxTokens = normalizeMaxTokens(
            context.provider!,
            request.maxTokens,
            undefined
        );

        const startTime = Date.now();
        let fullResponse = "";
        let error: Error | null = null;

        try {
            const stream = TimeoutWrapper.withStreamTimeout(
                this.providerManager.executeChatStream(
                    context.provider!,
                    this.buildMessages(request),
                    context.selectedModel!,
                    {
                        maxTokens: normalizedMaxTokens,
                        temperature: request.temperature,
                    }
                ),
                TimeoutConfig.streamingTimeoutMs,
                "Provider Streaming Request"
            );

            for await (const chunk of stream) {
                fullResponse += chunk;
                yield chunk;
            }
        } catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
            throw error;
        } finally {
            const latencyMs = Date.now() - startTime;
            const apiKeyId = request.apiKeyId || "unknown";

            usageMeter.recordRequestUsage({
                requestId: request.requestId || `req-${Date.now()}`,
                apiKeyId,
                provider: context.provider!,
                model: context.selectedModel!,
                prompt: request.prompt,
                response: fullResponse,
                latencyMs,
                success: !error,
                errorMessage: error?.message,
            });
        }
    }
}