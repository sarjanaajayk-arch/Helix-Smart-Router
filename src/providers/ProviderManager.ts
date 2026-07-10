import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { RetryEngine } from "../orchestrator/RetryEngine";

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

        return RetryEngine.execute(() =>
            provider.chat(messages)
        );

    }

}

export const providerManager = new ProviderManager();