import { ProviderManager } from "../providers/ProviderManager";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";

export class SmartRouter {
    constructor(
        private readonly providerManager: ProviderManager
    ) {}

    async route(
        request: RoutingRequest
    ): Promise<RoutingResponse> {

        const provider = this.providerManager.getProvider("gemini");

        const response = await provider.chat([
            {
                role: "user",
                content: request.prompt,
            },
        ]);

        return {
            content: response.content,
            provider: response.provider,
            model: response.model,
        };
    }
}