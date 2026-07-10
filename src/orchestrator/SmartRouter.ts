import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { RoutingRules } from "./RoutingRules";

export class SmartRouter {
    constructor(
        private readonly providerManager: ProviderManager
    ) {}

    /**
     * Converts a RoutingRequest into the provider message format.
     */
    private buildMessages(request: RoutingRequest): {
        role: "user";
        content: string;
    }[] {
        return [
            {
                role: "user",
                content: request.prompt,
            },
        ];
    }

    /**
     * Routes a standard (non-streaming) request.
     */
    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {
        const providerName = RoutingRules.selectProvider(
            request.taskType
        );

        const response = await this.providerManager.executeChat(
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
    ): AsyncGenerator<string, void, unknown> {
        const providerName = RoutingRules.selectProvider(
            request.taskType
        );

        const stream = this.providerManager.executeChatStream(
            providerName,
            this.buildMessages(request)
        );

        for await (const chunk of stream) {
            yield chunk;
        }
    }
}