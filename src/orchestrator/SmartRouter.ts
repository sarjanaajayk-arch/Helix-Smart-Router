import { RouterConfig } from "../config/RouterConfig";
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

        const providerName =
            this.selectProvider(request);

        const estimatedTokens =
            this.estimateTokens(request.prompt);

        const model =
            ModelSelector.select(
                providerName,
                request.taskType,
                estimatedTokens
            );

        const response =
            await this.providerManager.executeChat(
                providerName,
                this.buildMessages(request),
                model
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

        const providerName =
            this.selectProvider(request);

        const estimatedTokens =
            this.estimateTokens(request.prompt);

        const model =
            ModelSelector.select(
                providerName,
                request.taskType,
                estimatedTokens
            );

        const stream =
            this.providerManager.executeChatStream(
                providerName,
                this.buildMessages(request),
                model
            );

        for await (const chunk of stream) {
            yield chunk;
        }
    }
}