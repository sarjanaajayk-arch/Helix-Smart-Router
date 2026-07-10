import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { RetryEngine } from "../orchestrator/RetryEngine";
import { PROVIDERS } from "../orchestrator/ProviderRegistry";
import { FailoverEngine } from "../orchestrator/FailoverEngine";

export class ProviderManager {

    private providers: Map<string, AIProvider>;

    constructor() {
        this.providers = new Map();

        this.providers.set("gemini", new GeminiProvider());
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

            return await RetryEngine.execute(() =>
                provider.chat(messages)
            );

        } catch (error) {

            const nextProvider = FailoverEngine.getNextProvider(
                PROVIDERS,
                providerName
            );

            if (!nextProvider) {
                throw error;
            }

            const fallback = this.getProvider(nextProvider.provider);

            return RetryEngine.execute(() =>
                fallback.chat(messages)
            );

        }
    }

} // ✅ This brace closes the ProviderManager class

export const providerManager = new ProviderManager();