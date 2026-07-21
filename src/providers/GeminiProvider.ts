import { GoogleGenAI } from "@google/genai";

import { BaseProvider } from "./BaseProvider";
import { ChatMessage, ChatResponse, AIModelInfo } from "./AIProvider";
import { env } from "../config/env";

export class GeminiProvider extends BaseProvider {
    readonly name = "Gemini";

    private readonly ai: GoogleGenAI;
    private readonly model: string;
    private availableModels: AIModelInfo[] = [];

    constructor() {
        super();

        this.model = env.GEMINI_MODEL;

        this.ai = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY,
        });
    }

    async getAvailableModels(): Promise<AIModelInfo[]> {
        // If we already have cached models, return them
        if (this.availableModels.length > 0) {
            return this.availableModels;
        }

        try {
            // Note: Google GenAI SDK doesn't have a direct model listing method
            // We'll use known models for now, but this could be enhanced
            // with actual API calls if the SDK supports it
            this.availableModels = [
                {
                    id: "gemini-2.5-flash-lite",
                    name: "Gemini 2.5 Flash Lite",
                    contextWindow: 1048576,
                    maxOutputTokens: 8192,
                    supportsChat: true,
                    supportsVision: true,
                    supportsStreaming: true,
                    supportsFunctionCalling: true,
                    supportsReasoning: true,
                    supportsCoding: true,
                    inputPricePerMillionTokens: 0.10,
                    outputPricePerMillionTokens: 0.40,
                },
                {
                    id: "gemini-2.5-flash",
                    name: "Gemini 2.5 Flash",
                    contextWindow: 1048576,
                    maxOutputTokens: 8192,
                    supportsChat: true,
                    supportsVision: true,
                    supportsStreaming: true,
                    supportsFunctionCalling: true,
                    supportsReasoning: true,
                    supportsCoding: true,
                    inputPricePerMillionTokens: 0.30,
                    outputPricePerMillionTokens: 2.50,
                },
                {
                    id: "gemini-2.5-pro",
                    name: "Gemini 2.5 Pro",
                    contextWindow: 1048576,
                    maxOutputTokens: 65536,
                    supportsChat: true,
                    supportsVision: true,
                    supportsStreaming: true,
                    supportsFunctionCalling: true,
                    supportsReasoning: true,
                    supportsCoding: true,
                    inputPricePerMillionTokens: 1.25,
                    outputPricePerMillionTokens: 10.00,
                }
            ];

            return this.availableModels;
        } catch (error) {
            console.error("Failed to fetch Gemini models:", error);
            // Return empty array on error - will fall back to defaults
            return [];
        }
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

        console.log("[Provider] Starting to iterate Google stream");
                    let chunkCount = 0;
                    for await (const chunk of stream) {
                        chunkCount++;
                        console.log(`[Provider] Chunk ${chunkCount} received, text:`, chunk.text ? "YES" : "NO", "text length:", chunk.text?.length || 0);
                        if (chunk.text) {
                            console.log("[Provider] yielded chunk, length:", chunk.text.length);
                            yield chunk.text;
                        }
                    }
                    console.log("[Provider] Google stream iteration complete, total chunks:", chunkCount);
    }

    async *generateStream(messages: ChatMessage[]): AsyncGenerator<string> {
        // For Gemini, generateStream is the same as chatStream
        yield* this.chatStream(messages);
    }
}