export interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface OpenAIChatResponse {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: OpenAIMessage;
        finish_reason: "stop" | "length" | "tool_calls" | null;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}