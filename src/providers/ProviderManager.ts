import { AIProvider, ChatMessage, ChatResponse, AIModelInfo, GenerationOptions } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";

import { RetryEngine } from "../orchestrator/RetryEngine";
import { FailoverEngine } from "../orchestrator/FailoverEngine";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { TimeoutWrapper } from "../orchestrator/TimeoutWrapper";
import { TimeoutConfig } from "../config/TimeoutConfig";
import { TokenAccounting } from "../orchestrator/TokenAccounting";

import { ProviderType } from "../types/ProviderType";
import { ProviderCapabilities } from "../models/ProviderCapabilities";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";
import { MetricsManager } from "../metrics/MetricsManager";
import { helixLogger } from "../config/logger";
import { OutputValidator } from "../validation/OutputValidator";
import { env } from "../config/env";
import { ModelRegistryService } from "../registry/ModelRegistryService";

export class ProviderManager {
    private providers: Map<string, AIProvider & { getAvailableModels: () => Promise<AIModelInfo[]> }>;
    private providerModels: Map<string, AIModelInfo[]>; // provider -> available models

    constructor() {
        this.providers = new Map();
        this.providerModels = new Map();

        // Initialize providers based on available API keys
        this.initializeProviders();

        // Initialize health monitoring for configured providers
        const configuredProviders: ProviderType[] = [];
        if (this.providers.has("gemini")) configuredProviders.push(ProviderType.GEMINI);
        if (this.providers.has("openrouter")) configuredProviders.push(ProviderType.OPENROUTER);

        HealthMonitor.initialize(configuredProviders);
    }

    private initializeProviders(): void {
        // Initialize Gemini if API key is available
        if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
            const geminiProvider = new GeminiProvider();
            this.providers.set("gemini", geminiProvider);
            this.loadProviderModels("gemini", geminiProvider);
        }

        // Initialize OpenRouter if API key is available
        if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0) {
            const openrouterProvider = new OpenRouterProvider();
            this.providers.set("openrouter", openrouterProvider);
            this.loadProviderModels("openrouter", openrouterProvider);
        }
    }

    private async loadProviderModels(providerName: string, provider: AIProvider & { getAvailableModels: () => Promise<AIModelInfo[]> }): Promise<void> {
        try {
            const models = await provider.getAvailableModels();
            this.providerModels.set(providerName, models);
            helixLogger.info(`Loaded ${models.length} models for provider ${providerName}`, {
                provider: providerName,
                modelCount: models.length
            });
        } catch (error) {
            helixLogger.warn(`Failed to load models for provider ${providerName}: ${error instanceof Error ? error.message : String(error)}`, {
                provider: providerName,
            });
            // Continue with empty model list - provider will still be usable with default model
            this.providerModels.set(providerName, []);
        }
    }

    /** Get all available providers */
    getProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /** Get provider by name */
    getProvider(name: string): AIProvider & { getAvailableModels: () => Promise<AIModelInfo[]> } {
        const provider = this.providers.get(name);

        if (!provider) {
            throw new Error(`Provider '${name}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
        }

        return provider;
    }

    /** Get available models for a provider */
    async getProviderModels(providerName: string): Promise<AIModelInfo[]> {
        const models = this.providerModels.get(providerName);
        if (models !== undefined) {
            return models;
        }

        // Try to load models on demand if not cached
        const provider = this.providers.get(providerName);
        if (provider && typeof (provider as any).getAvailableModels === 'function') {
            try {
                const models = await (provider as any).getAvailableModels();
                this.providerModels.set(providerName, models);
                return models;
            } catch (error) {
                helixLogger.warn(`Failed to load models for provider ${providerName}: ${error instanceof Error ? error.message : String(error)}`, {
                    provider: providerName,
                });
                return [];
            }
        }

        return [];
    }

    /** Get all available models across all providers */
    async getAllModels(): Promise<Record<string, AIModelInfo[]>> {
        const result: Record<string, AIModelInfo[]> = {};

        for (const [providerName, provider] of this.providers.entries()) {
            result[providerName] = await this.getProviderModels(providerName);
        }

        return result;
    }

    /** Find a model across all providers */
    findModel(modelId: string): { provider: string; model: AIModelInfo } | null {
        for (const [providerName, models] of this.providerModels.entries()) {
            const model = models.find(m => m.id === modelId);
            if (model) {
                return { provider: providerName, model };
            }
        }
        return null;
    }

    /** Get best available model for a given task and requirements */
    async getBestModel(
        taskType: string,
        estimatedTokens: number,
        requiredCapabilities: Partial<Pick<AIModelInfo,
            'supportsChat'
            | 'supportsVision'
            | 'supportsStreaming'
            | 'supportsFunctionCalling'
            | 'supportsReasoning'
            | 'supportsCoding'
        >> = {}
    ): Promise<{ provider: string; model: AIModelInfo } | null> {
        let bestMatch: { provider: string; model: AIModelInfo; score: number } | null = null;

        for (const [providerName, models] of this.providerModels.entries()) {
            // Skip if provider is unhealthy
            const providerType = providerName === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER;
            if (!HealthMonitor.isHealthy(providerType)) {
                continue;
            }

            for (const model of models) {
                // Check if model meets basic requirements
                if (!this.meetsRequirements(model, requiredCapabilities)) {
                    continue;
                }

                // Check if model can handle the token count
                if (model.maxOutputTokens < 1) { // At least 1 token for generation
                    continue;
                }

                // Calculate suitability score
                const score = this.calculateModelScore(model, estimatedTokens, taskType);

                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { provider: providerName, model, score };
                }
            }
        }

        return bestMatch ? { provider: bestMatch.provider, model: bestMatch.model } : null;
    }

    private meetsRequirements(model: AIModelInfo, requirements: Partial<Pick<AIModelInfo,
        'supportsChat'
        | 'supportsVision'
        | 'supportsStreaming'
        | 'supportsFunctionCalling'
        | 'supportsReasoning'
        | 'supportsCoding'
    >>): boolean {
        if (requirements.supportsChat !== undefined && !model.supportsChat) return false;
        if (requirements.supportsVision !== undefined && !model.supportsVision) return false;
        if (requirements.supportsStreaming !== undefined && !model.supportsStreaming) return false;
        if (requirements.supportsFunctionCalling !== undefined && !model.supportsFunctionCalling) return false;
        if (requirements.supportsReasoning !== undefined && !model.supportsReasoning) return false;
        if (requirements.supportsCoding !== undefined && !model.supportsCoding) return false;

        return true;
    }

    private calculateModelScore(model: AIModelInfo, estimatedTokens: number, taskType: string): number {
        let score = 0;

        // Prefer models that can handle the token count comfortably
        const tokenFit = model.maxOutputTokens >= estimatedTokens ? 1.0 : model.maxOutputTokens / estimatedTokens;
        score += tokenFit * 30; // Weight for token capacity

        // Prefer lower cost (inverse of price)
        const costScore = (model.inputPricePerMillionTokens ?? 1000) < 50 ? 20 :
                         (model.inputPricePerMillionTokens ?? 1000) < 10 ? 15 : 10;
        score += costScore;

        // Prefer higher performing models for complex tasks
        if (taskType.includes('reason') || taskType.includes('code')) {
            if (model.supportsReasoning) score += 20;
            if (model.supportsCoding) score += 15;
        }

        // Prefer models with vision for vision tasks
        if (taskType.includes('vision') || taskType.includes('image')) {
            if (model.supportsVision) score += 25;
        }

        // Slight preference for newer/higher numbered models
        if (model.id.includes('pro') || model.id.includes('Ultra')) score += 10;
        if (model.id.includes('-latest')) score += 5;

        return score;
    }

    private async executeWithMetrics(
                providerName: string,
                messages: ChatMessage[],
                model: string = "unknown",
                options?: GenerationOptions
            ): Promise<ChatResponse> {
                const provider = this.getProvider(providerName);
                const startTime = Date.now();

                // Try to get more specific model info if we have it
                let modelInfo: string = model;
                const providerModels = this.providerModels.get(providerName);
                if (providerModels) {
                    const modelObj = providerModels.find(m => m.id === model);
                    if (modelObj) {
                        modelInfo = `${modelObj.name} (${modelObj.id})`;
                    }
                }

                MetricsManager.recordRequest();

                helixLogger.info("Provider Selected", {
                    provider: providerName,
                    model: modelInfo,
                    stream: false
                });

                // Log the payload being sent to the provider
                helixLogger.info("Provider Request Payload", {
                    provider: providerName,
                    model: modelInfo,
                    messages: messages,
                    options: options
                });

                try {
                    const response = await RetryEngine.execute(() =>
                        TimeoutWrapper.withTimeout(
                            provider.chat(messages, model, options),
                            TimeoutConfig.providerTimeoutMs,
                            `${providerName} chat`
                        )
                    );

                    // Validate provider response
                    const validation = OutputValidator.validateChatResponse(response, providerName, messages);
                    if (!validation.valid) {
                        throw new Error(validation.error ?? "Provider response validation failed");
                    }

                    const latency = Date.now() - startTime;

                    // Estimate token usage for accounting
                    const promptText = messages.map(m => m.content).join("\n");
                    const promptTokens = TokenAccounting.estimateTokens(promptText);
                    const completionTokens = TokenAccounting.estimateTokens(response.content);
                    TokenAccounting.recordUsage(providerName as ProviderType, promptTokens, completionTokens);

                    HealthMonitor.recordSuccess(providerName as ProviderType);
                    MetricsManager.recordSuccess(providerName as ProviderType, latency);

                    return validation.sanitizedResponse!;
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
            model: string = "unknown",
            options?: GenerationOptions
        ): Promise<ChatResponse> {
            console.log(`[ProviderManager.executeChat] Called with: providerName=${providerName}, model=${model}, messagesCount=${messages.length}`);
        
            try {
                return await this.executeWithMetrics(
                    providerName,
                    messages,
                    model,
                    options
                );
            } catch (error) {
            // Get the list of providers that we have initialized (and are in the PROVIDERS registry)
            const availableProviders = PROVIDERS.filter(p =>
                this.providers.has(p.provider)
            );

            const nextProvider = FailoverEngine.getNextProvider(
                availableProviders,
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

            // Extract the provider name (string) from the ProviderCapabilities
            const nextProviderName = nextProvider.provider;

            // Try to find a similar model on the fallback provider
            let fallbackModel = model;
            const currentModelInfo = this.findModel(model);
            if (currentModelInfo) {
                // Try to find equivalent model on fallback provider
                const fallbackModels = this.providerModels.get(nextProviderName);
                if (fallbackModels) {
                    // Look for similar model (same family, similar capabilities)
                    const similarModel = fallbackModels.find(m =>
                        m.id.includes(currentModelInfo.model.id.split('-')[0]) ||  // Same base model name
                        (model.includes('flash') && m.id.includes('flash')) ||     // Both flash variants
                        (model.includes('pro') && m.id.includes('pro'))            // Both pro variants
                    );

                    if (similarModel) {
                        fallbackModel = similarModel.id;
                    }
                }
            }

            helixLogger.warn("Provider Failover", {
                failoverFrom: providerName,
                failoverTo: nextProviderName,
                reason: error instanceof Error ? error.message : String(error),
                model: fallbackModel,
                stream: false,
            });

            return await this.executeWithMetrics(
                            nextProviderName,
                            messages,
                            fallbackModel,
                            options
                        );
        }
    }

    async *executeChatStream(
                providerName: string,
                messages: ChatMessage[],
                model: string = "unknown",
                options?: GenerationOptions
            ): AsyncGenerator<string> {
                console.log(`[ProviderManager.executeChatStream] Called with: providerName=${providerName}, model=${model}, messagesCount=${messages.length}`);
        
                const provider = this.getProvider(providerName);
            const startTime = Date.now();

            // Try to get more specific model info if we have it
            let modelInfo: string = model;
            const providerModels = this.providerModels.get(providerName);
            if (providerModels) {
                const modelObj = providerModels.find(m => m.id === model);
                if (modelObj) {
                    modelInfo = `${modelObj.name} (${modelObj.id})`;
                }
            }

            if (typeof provider.generateStream !== "function") {
                throw new Error(
                    `Provider '${providerName}' does not support streaming.`
                );
            }

            try {
                console.log("[ProviderManager] Starting to iterate provider.generateStream");
                for await (const chunk of provider.generateStream(messages, model, options)) {
                    console.log("[ProviderManager] Received chunk from provider, length:", chunk.length);
                    yield chunk;
                }
                console.log("[ProviderManager] Stream iteration complete");

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