export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatResponse {
    content: string;
    provider: string;
    model: string;
}

export interface AIProvider {
    readonly name: string;

    /**
     * Standard request-response chat
     */
    chat(
        messages: ChatMessage[]
    ): Promise<ChatResponse>;

    /**
     * Streaming chat
     * Returns each generated token/chunk asynchronously.
     */
    chatStream(
        messages: ChatMessage[]
    ): AsyncGenerator<string>;
}