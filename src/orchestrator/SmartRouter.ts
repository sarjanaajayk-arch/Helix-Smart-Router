import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";
import { RoutingRules } from "./RoutingRules";
import { MetricsManager } from "../metrics/MetricsManager";

export class SmartRouter {
    constructor(
        private readonly providerManager: ProviderManager
    ) {}

    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {

        MetricsManager.recordRequest();

        const providerName = RoutingRules.selectProvider(
            request.taskType
        );

        const response = await this.providerManager.executeChat(
            providerName,
            [
                {
                    role: "user",
                    content: request.prompt,
                },
            ]
        );

        return {
            content: response.content,
            provider: response.provider,
            model: response.model,
        };
    }
}