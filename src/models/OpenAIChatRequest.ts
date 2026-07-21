export interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface OpenAIChatRequest {
    model: string;
    messages: OpenAIMessage[];

    temperature?: number;
    max_tokens?: number;
    top_p?: number;

    tools?: any[];
    tool_choice?: any;

    user?: string;
    stream?: boolean;
}