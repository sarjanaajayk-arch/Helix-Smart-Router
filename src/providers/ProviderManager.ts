import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";

import { RetryEngine } from "../orchestrator/RetryEngine";
import { FailoverEngine } from "../orchestrator/FailoverEngine";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";

import { ProviderType } from "../types/ProviderType";

export class ProviderManager {

    private providers: Map<string, AIProvider>;

    constructor() {

        this.providers = new Map();

        this.providers.set(
            "gemini",
            new GeminiProvider()
        );

        this.providers.set(
            "openrouter",
            new OpenRouterProvider()
        );

        HealthMonitor.initialize([
            ProviderType.GEMINI,
            ProviderType.OPENROUTER,
        ]);

    }

    getProvider(name: string): AIProvider {

        const provider = this.providers.get(name);

        if (!provider) {
            throw new Error(`Provider '${name}' not found.`);
        }

        return provider;

    }

    async executeChat(
        providerName: string,
        messages: ChatMessage[]
    ): Promise<ChatResponse> {

        const provider = this.getProvider(providerName);

        try {

            const response = await RetryEngine.execute(() =>
                provider.chat(messages)
            );

            HealthMonitor.recordSuccess(
                providerName as ProviderType
            );

            return response;

        } catch (error) {

            HealthMonitor.recordFailure(
                providerName as ProviderType
            );

            const nextProvider = FailoverEngine.getNextProvider(
                PROVIDERS,
                providerName
            );

            if (!nextProvider) {
                throw error;
            }

            const fallback = this.getProvider(
                nextProvider.provider
            );

            return RetryEngine.execute(() =>
                fallback.chat(messages)
            );

        }

    }

}

export const providerManager = new ProviderManager();