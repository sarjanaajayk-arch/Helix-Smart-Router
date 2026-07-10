import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";

import { RetryEngine } from "../orchestrator/RetryEngine";
import { FailoverEngine } from "../orchestrator/FailoverEngine";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";

import { ProviderType } from "../types/ProviderType";
import { MetricsManager } from "../metrics/MetricsManager";

export class ProviderManager {
    private providers: Map<string, AIProvider>;

    constructor() {
        this.providers = new Map();

        this.providers.set("gemini", new GeminiProvider());
        this.providers.set("openrouter", new OpenRouterProvider());

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

    private async executeWithMetrics(
        providerName: string,
        messages: ChatMessage[]
    ): Promise<ChatResponse> {
        const provider = this.getProvider(providerName);
        const startTime = Date.now();

        try {
            const response = await RetryEngine.execute(() =>
                provider.chat(messages)
            );

            const latency = Date.now() - startTime;

            HealthMonitor.recordSuccess(providerName as ProviderType);
            MetricsManager.recordSuccess(
                providerName as ProviderType,
                latency
            );

            return response;
        } catch (error) {
            const latency = Date.now() - startTime;

            HealthMonitor.recordFailure(providerName as ProviderType);
            MetricsManager.recordFailure(
                providerName as ProviderType,
                latency
            );

            throw error;
        }
    }

    async executeChat(
        providerName: string,
        messages: ChatMessage[]
    ): Promise<ChatResponse> {
        MetricsManager.recordRequest();

        try {
            return await this.executeWithMetrics(providerName, messages);
        } catch (error) {
            const nextProvider = FailoverEngine.getNextProvider(
                PROVIDERS,
                providerName
            );

            if (!nextProvider) {
                throw error;
            }

            MetricsManager.recordFailover();

            return await this.executeWithMetrics(
                nextProvider.provider,
                messages
            );
        }
    }
}

export const providerManager = new ProviderManager();