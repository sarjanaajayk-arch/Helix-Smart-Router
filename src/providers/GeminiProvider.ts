import { GoogleGenAI } from "@google/genai";

import { BaseProvider } from "./BaseProvider";
import { ChatMessage, ChatResponse, AIModelInfo, GenerationOptions } from "./AIProvider";
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

  async chat(
      messages: ChatMessage[],
      model: string,
      options?: GenerationOptions
    ): Promise<ChatResponse> {
      this.log(`Sending request to Gemini with model: ${model}...`);

      const prompt = messages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

      // Determine maxTokens: use options.maxTokens if provided, otherwise use model's maxOutputTokens
      const maxTokens = options?.maxTokens ?? this.getModelMaxOutputTokens(model);
      this.log(`GeminiProvider.chat options.maxTokens: ${options?.maxTokens ?? "undefined"}`);
      this.log(`GeminiProvider.chat maxTokens to use: ${maxTokens}`);

      this.log(`GeminiProvider.chat generationConfig.maxOutputTokens: ${maxTokens}`);
      const result = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          maxOutputTokens: maxTokens,
        },
      });

      return {
        content: result.text ?? "",
        provider: this.name,
        model: model,
      };
    }

    private getModelMaxOutputTokens(modelId: string): number {
      const modelInfo = this.availableModels.find((m) => m.id === modelId);
      return modelInfo?.maxOutputTokens ?? 8192;
    }

    async *chatStream(
      messages: ChatMessage[],
      model: string,
      options?: GenerationOptions
    ): AsyncGenerator<string> {
      this.log(`Streaming request to Gemini with model: ${model}...`);

      const prompt = messages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

      // Determine maxTokens for streaming
      const maxTokens = options?.maxTokens ?? this.getModelMaxOutputTokens(model);

      const stream =
        await this.ai.models.generateContentStream({
          model: model,
          contents: prompt,
          config: {
            maxOutputTokens: maxTokens,
          },
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

    async *generateStream(
      messages: ChatMessage[],
      model: string,
      options?: GenerationOptions
    ): AsyncGenerator<string> {
      // For Gemini, generateStream is the same as chatStream
      yield* this.chatStream(messages, model, options);
    }
  }
