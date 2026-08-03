import { GoogleGenAI } from "@google/genai";

import { BaseProvider } from "./BaseProvider";
import {
  ChatMessage,
  ChatResponse,
  AIModelInfo,
  GenerationOptions,
} from "./AIProvider";
import { env } from "../config/env";

export class GeminiProvider extends BaseProvider {
  readonly name = "Gemini";

  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private availableModels: AIModelInfo[] = [];

  constructor(apiKey?: string) {
    super();

    console.log("🔥 GEMINI CONSTRUCTOR", {
      apiKeyPrefix: apiKey?.substring(0, 10),
      usingEnvFallback: !apiKey,
    });

    this.model = env.GEMINI_MODEL;

    this.ai = new GoogleGenAI({
      apiKey: apiKey ?? env.GEMINI_API_KEY,
    });
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    if (this.availableModels.length > 0) {
      return this.availableModels;
    }

    try {
      this.availableModels = [
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
        },
      ];

      return this.availableModels;
    } catch (error) {
      console.error("Failed to fetch Gemini models:", error);
      return [];
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): Promise<ChatResponse> {
    console.log("🔥 GEMINI PROVIDER ENTER");

    this.log(`Sending request to Gemini with model: ${model}...`);

    const prompt = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const maxTokens =
      options?.maxTokens ?? this.getModelMaxOutputTokens(model);

    this.log(
      `GeminiProvider.chat options.maxTokens: ${
        options?.maxTokens ?? "undefined"
      }`
    );

    this.log(`GeminiProvider.chat maxTokens to use: ${maxTokens}`);

    console.log("🔥 GEMINI REQUEST", {
      model,
      promptLength: prompt.length,
      maxTokens,
    });

    try {
      console.log("🔥 CALLING GOOGLE GEMINI API");

      console.log("======================================");
      console.log("FINAL MODEL SENT TO GOOGLE:", model);
      console.log("PROMPT:");
      console.log(prompt);
      console.log("======================================");

      const result = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: maxTokens,
        },
      });

      return {
        content: result.text ?? "",
        provider: this.name,
        model,
      };
    } catch (error: any) {
      console.error("================================");
      console.error("FULL GEMINI ERROR");
      console.error("================================");

      console.error(error);

      console.error("MESSAGE:", error?.message);
      console.error("STATUS:", error?.status);
      console.error("STACK:");
      console.error(error?.stack);

      if (error?.response) {
        console.error("RESPONSE:");
        console.dir(error.response, { depth: null });
      }

      throw error;
    }
  }

  private getModelMaxOutputTokens(modelId: string): number {
    const modelInfo = this.availableModels.find(
      (m) => m.id === modelId
    );

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

    const maxTokens =
      options?.maxTokens ?? this.getModelMaxOutputTokens(model);

    const stream = await this.ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: maxTokens,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  async *generateStream(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): AsyncGenerator<string> {
    yield* this.chatStream(messages, model, options);
  }
}