import { GoogleGenAI } from "@google/genai";

import { BaseProvider } from "./BaseProvider";
import { ChatMessage, ChatResponse } from "./AIProvider";
import { env } from "../config/env";

export class GeminiProvider extends BaseProvider {
    readonly name = "Gemini";

    private readonly ai: GoogleGenAI;
    private readonly model: string;

    constructor() {
        super();

        this.model = env.GEMINI_MODEL;

        this.ai = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY,
        });
    }

    async chat(messages: ChatMessage[]): Promise<ChatResponse> {
        this.log("Sending request to Gemini...");

        const prompt = messages
            .map((message) => `${message.role}: ${message.content}`)
            .join("\n");

        const result = await this.ai.models.generateContent({
            model: this.model,
            contents: prompt,
        });

        return {
            content: result.text ?? "",
            provider: this.name,
            model: this.model,
        };
    }

    async *chatStream(
        messages: ChatMessage[]
    ): AsyncGenerator<string> {

        this.log("Streaming request to Gemini...");

        const prompt = messages
            .map((message) => `${message.role}: ${message.content}`)
            .join("\n");

        const stream =
            await this.ai.models.generateContentStream({
                model: this.model,
                contents: prompt,
            });

        for await (const chunk of stream) {

            if (chunk.text) {
                yield chunk.text;
            }

        }
    }
}