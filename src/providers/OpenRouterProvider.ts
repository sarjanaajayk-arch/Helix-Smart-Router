import OpenAI from "openai";

import { BaseProvider } from "./BaseProvider";
import { ChatMessage, ChatResponse } from "./AIProvider";
import { env } from "../config/env";

export class OpenRouterProvider extends BaseProvider {
    readonly name = "OpenRouter";

    private readonly client: OpenAI;
    private readonly model: string;

    constructor() {
        super();

        this.model = env.OPENROUTER_MODEL;

        this.client = new OpenAI({
            apiKey: env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
        });
    }

    async chat(messages: ChatMessage[]): Promise<ChatResponse> {
        this.log("Sending request to OpenRouter...");

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map((message) => ({
                role: message.role as "user" | "assistant" | "system",
                content: message.content,
            })),
        });

        return {
            content: response.choices[0]?.message?.content ?? "",
            provider: this.name,
            model: this.model,
        };
    }

    async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
        this.log("Streaming request to OpenRouter...");

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map((message) => ({
                role: message.role as "user" | "assistant" | "system",
                content: message.content,
            })),
            stream: true,
        });

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) {
                yield token;
            }
        }
    }
}