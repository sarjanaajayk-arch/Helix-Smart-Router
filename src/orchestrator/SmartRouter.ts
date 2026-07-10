import { RouterConfig } from "../config/RouterConfig";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRules } from "./RoutingRules";

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
     * Selects the provider for a request.
     */
    private selectProvider(
        request: RoutingRequest
    ) {
        if (!RouterConfig.enableSmartRouting) {
            return RouterConfig.defaultProvider;
        }

        return RoutingRules.selectProvider(
            request.taskType
        );
    }

    /**
     * Routes a normal request.
     */
    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {

        const providerName =
            this.selectProvider(request);

        const response =
            await this.providerManager.executeChat(
                providerName,
                this.buildMessages(request)
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

        const stream =
            this.providerManager.executeChatStream(
                providerName,
                this.buildMessages(request)
            );

        for await (const chunk of stream) {
            yield chunk;
        }
    }
}