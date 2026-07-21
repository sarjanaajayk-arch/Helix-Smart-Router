import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";

export abstract class BaseProvider implements AIProvider {
    abstract readonly name: string;

    abstract chat(
        messages: ChatMessage[]
    ): Promise<ChatResponse>;

    abstract chatStream(
        messages: ChatMessage[]
    ): AsyncGenerator<string>;

    abstract generateStream(
        messages: ChatMessage[]
    ): AsyncGenerator<string>;

    /**
     * Get available models from the provider
     * Default implementation returns empty array - providers should override
     */
    async getAvailableModels(): Promise<Array<{ id: string; name: string; contextWindow: number; maxOutputTokens: number; supportsChat: boolean; supportsVision: boolean; supportsStreaming: boolean; supportsFunctionCalling: boolean; supportsReasoning: boolean; supportsCoding: boolean; inputPricePerMillionTokens?: number; outputPricePerMillionTokens?: number }>> {
        return [];
    }

    protected log(message: string): void {
        console.log(`[${this.name}] ${message}`);
    }
}