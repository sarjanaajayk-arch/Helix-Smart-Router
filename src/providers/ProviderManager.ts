import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";

import { RetryEngine } from "../orchestrator/RetryEngine";
import { FailoverEngine } from "../orchestrator/FailoverEngine";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";

import { ProviderType } from "../types/ProviderType";
import { MetricsManager } from "../metrics/MetricsManager";
import { helixLogger } from "../config/logger";

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
        messages: ChatMessage[],
        model: string = "unknown"
    ): Promise<ChatResponse> {
        const provider = this.getProvider(providerName);
        const startTime = Date.now();

        MetricsManager.recordRequest();

        try {
            helixLogger.info("Provider Selected", {
                provider: providerName,
                model,
                stream: false,
            });

            const response = await RetryEngine.execute(() =>
                provider.chat(messages)
            );

            const latency = Date.now() - startTime;

            HealthMonitor.recordSuccess(providerName as ProviderType);
            MetricsManager.recordSuccess(providerName as ProviderType, latency);

            return response;
        } catch (error) {
            const latency = Date.now() - startTime;

       HealthMonitor.recordFailure(providerName as ProviderType);
            MetricsManager.recordFailure(providerName as ProviderType, latency);

            throw error;
        }
    }

        async executeChat(
        providerName: string,
        messages: ChatMessage[],
        model: string = "unknown"
    ): Promise<ChatResponse> {
        try {
            return await this.executeWithMetrics(
                providerName,
                messages,
                model
            );
        } catch (error) {
            const nextProvider = FailoverEngine.getNextProvider(
                PROVIDERS,
                providerName
            );

            if (!nextProvider) {
                helixLogger.error(
                    "Failover unavailable",
                    error,
                    {
                        failoverFrom: providerName,
                    }
                );

                throw error;
            }

            MetricsManager.recordFailover();

            helixLogger.warn("Provider Failover", {
                failoverFrom: providerName,
                failoverTo: nextProvider.provider,
                reason:
                    error instanceof Error
                        ? error.message
                        : String(error),
                model,
                stream: false,
            });

                     return await this.executeWithMetrics(
                nextProvider.provider,
                messages,
                model
            );
        }
    }

    async *executeChatStream(
        providerName: string,
        messages: ChatMessage[],
        model: string = "unknown"
    ): AsyncGenerator<string> {
        const provider = this.getProvider(providerName);
        const startTime = Date.now();

        MetricsManager.recordRequest();

        helixLogger.info("Streaming Provider Selected", {
            provider: providerName,
            model,
            stream: true,
        });

        const streamingProvider = provider as unknown as {
            chatStream?: (messages: ChatMessage[]) => AsyncIterable<string>;
        };

        if (typeof streamingProvider.chatStream !== "function") {
            throw new Error(
                `Provider '${providerName}' does not support streaming.`
            );
        }

        try {
            for await (const chunk of streamingProvider.chatStream(messages)) {
                yield chunk;
            }

            const latency = Date.now() - startTime;

            HealthMonitor.recordSuccess(providerName as ProviderType);
            MetricsManager.recordSuccess(providerName as ProviderType, latency);
        } catch (error) {
            const latency = Date.now() - startTime;

            HealthMonitor.recordFailure(providerName as ProviderType);
            MetricsManager.recordFailure(providerName as ProviderType, latency);

            throw error;
        }
    }
}