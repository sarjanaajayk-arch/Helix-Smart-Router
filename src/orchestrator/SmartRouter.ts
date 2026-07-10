import { TaskType } from "../types/TaskType";
import { RouterConfig } from "../config/RouterConfig";
import { RoutingContext } from "../models/RoutingContext";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRules } from "./RoutingRules";
import { ModelSelector } from "./ModelSelector";
import { RoutingPolicy } from "../types/RoutingPolicy";

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
    ): string {

        if (!RouterConfig.enableSmartRouting) {
            return RouterConfig.defaultProvider;
        }

        return RoutingRules.selectProvider(request.taskType);
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

        context.provider =
            this.selectProvider(request);

        context.estimatedTokens =
            this.estimateTokens(request.prompt);

        const policy = this.selectPolicy(request);

        context.selectedModel =
            ModelSelector.select(
                context.provider,
                request.taskType,
                context.estimatedTokens,
                policy
            );

        const response =
            await this.providerManager.executeChat(
                context.provider!,
                this.buildMessages(request),
                context.selectedModel!
            );

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

        context.provider =
            this.selectProvider(request);

        context.estimatedTokens =
            this.estimateTokens(request.prompt);

        const policy = this.selectPolicy(request);

        context.selectedModel =
            ModelSelector.select(
                context.provider,
                request.taskType,
                context.estimatedTokens,
                policy
            );

        const stream =
            this.providerManager.executeChatStream(
                context.provider!,
                this.buildMessages(request),
                context.selectedModel!
            );

        for await (const chunk of stream) {
            yield chunk;
        }
    }
}