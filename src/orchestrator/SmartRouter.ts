import { RouterConfig } from "../config/RouterConfig";
import { RoutingContext } from "../models/RoutingContext";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRules } from "./RoutingRules";
import { ModelSelector } from "./ModelSelector";

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
     * Routes a normal request.
     */
    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {

        // Create routing context
        const context: RoutingContext = {
            request,
        };

        // Select provider
        context.provider =
            this.selectProvider(request);

        // Estimate prompt tokens
        context.estimatedTokens =
            this.estimateTokens(request.prompt);

        // Select model
        context.selectedModel =
            ModelSelector.select(
                context.provider,
                request.taskType,
                context.estimatedTokens
            );

        // Execute request
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

        // Create routing context
        const context: RoutingContext = {
            request,
        };

        // Select provider
        context.provider =
            this.selectProvider(request);

        // Estimate prompt tokens
        context.estimatedTokens =
            this.estimateTokens(request.prompt);

        // Select model
        context.selectedModel =
            ModelSelector.select(
                context.provider,
                request.taskType,
                context.estimatedTokens
            );

        // Execute streaming request
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