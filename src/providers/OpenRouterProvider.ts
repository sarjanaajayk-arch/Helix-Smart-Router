import OpenAI from "openai";

import { BaseProvider } from "./BaseProvider";
import {
  ChatMessage,
  ChatResponse,
  AIModelInfo,
  GenerationOptions,
} from "./AIProvider";
import { env } from "../config/env";

export class OpenRouterProvider extends BaseProvider {
  readonly name = "OpenRouter";

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string) {
    super();

    this.model = env.OPENROUTER_MODEL;

    this.client = new OpenAI({
      apiKey: apiKey ?? env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    try {
      const response = await this.client.models.list();

      const knownModels: Record<string, Partial<AIModelInfo>> = {
        "openai/gpt-4o": {
          contextWindow: 128000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 5.0,
          outputPricePerMillionTokens: 15.0,
        },
        "openai/gpt-4o-mini": {
          contextWindow: 128000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.15,
          outputPricePerMillionTokens: 0.6,
        },
        "openai/gpt-4-turbo": {
          contextWindow: 128000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 10.0,
          outputPricePerMillionTokens: 30.0,
        },
        "openai/gpt-3.5-turbo": {
          contextWindow: 16385,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.5,
          outputPricePerMillionTokens: 1.5,
        },

        "anthropic/claude-3.5-sonnet": {
          contextWindow: 200000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 3.0,
          outputPricePerMillionTokens: 15.0,
        },
        "anthropic/claude-3-opus": {
          contextWindow: 200000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 15.0,
          outputPricePerMillionTokens: 75.0,
        },
        "anthropic/claude-3-haiku": {
          contextWindow: 200000,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.25,
          outputPricePerMillionTokens: 1.25,
        },

        "google/gemini-pro-1.5": {
          contextWindow: 32768,
          maxOutputTokens: 8192,
          inputPricePerMillionTokens: 0.35,
          outputPricePerMillionTokens: 1.05,
        },
        "google/gemini-flash-1.5": {
          contextWindow: 32768,
          maxOutputTokens: 8192,
          inputPricePerMillionTokens: 0.07,
          outputPricePerMillionTokens: 0.30,
        },

        "meta-llama/llama-3-70b-instruct": {
          contextWindow: 8192,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.42,
          outputPricePerMillionTokens: 0.57,
        },
        "meta-llama/llama-3-8b-instruct": {
          contextWindow: 8192,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.06,
          outputPricePerMillionTokens: 0.09,
        },

        "mistralai/mistral-large": {
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 2.0,
          outputPricePerMillionTokens: 6.0,
        },
        "mistralai/mistral-medium": {
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.45,
          outputPricePerMillionTokens: 1.35,
        },
        "mistralai/mistral-small": {
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.06,
          outputPricePerMillionTokens: 0.18,
        },

        "deepseek/deepseek-chat": {
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.27,
          outputPricePerMillionTokens: 1.1,
        },
        "deepseek/deepseek-coder": {
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputPricePerMillionTokens: 0.27,
          outputPricePerMillionTokens: 1.1,
        },
      };

      return response.data.map((model: any) => {
        const specs = knownModels[model.id] || {};

        return {
          id: model.id,
          name: model.id.replace(/\//g, " ").replace(/([a-z])([A-Z])/g, "$1 $2"),
          contextWindow: specs.contextWindow ?? 32768,
          maxOutputTokens: specs.maxOutputTokens ?? 4096,
          supportsChat: true,
          supportsVision:
            model.id.includes("vision") ||
            model.id.includes("visual"),
          supportsStreaming: true,
          supportsFunctionCalling: true,
          supportsReasoning:
            model.id.includes("reasoning") ||
            model.id.includes("o1") ||
            model.id.includes("o3"),
          supportsCoding:
            model.id.includes("code") ||
            model.id.includes("coder") ||
            model.id.includes("programming"),
          inputPricePerMillionTokens: specs.inputPricePerMillionTokens,
          outputPricePerMillionTokens: specs.outputPricePerMillionTokens,
        };
      });
    } catch (error) {
      console.error("Failed to fetch OpenRouter models:", error);

      return [
        {
          id: "openai/gpt-4o",
          name: "OpenAI GPT-4o",
          contextWindow: 128000,
          maxOutputTokens: 4096,
          supportsChat: true,
          supportsVision: true,
          supportsStreaming: true,
          supportsFunctionCalling: true,
          supportsReasoning: false,
          supportsCoding: true,
          inputPricePerMillionTokens: 5,
          outputPricePerMillionTokens: 15,
        },
        {
          id: "anthropic/claude-3.5-sonnet",
          name: "Anthropic Claude 3.5 Sonnet",
          contextWindow: 200000,
          maxOutputTokens: 4096,
          supportsChat: true,
          supportsVision: true,
          supportsStreaming: true,
          supportsFunctionCalling: true,
          supportsReasoning: true,
          supportsCoding: true,
          inputPricePerMillionTokens: 3,
          outputPricePerMillionTokens: 15,
        },
      ];
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): Promise<ChatResponse> {
    this.log(`Sending request to OpenRouter with model: ${model}...`);

    const openaiMessages = messages.map((message) => ({
      role: ["system", "user", "assistant"].includes(message.role)
        ? (message.role as "system" | "user" | "assistant")
        : "user",
      content: ["system", "user", "assistant"].includes(message.role)
        ? message.content
        : `[${message.role}] ${message.content}`,
    }));

    const params: any = {
      model,
      messages: openaiMessages,
    };

    if (options?.maxTokens) {
      params.max_tokens = options.maxTokens;
    }

    if (options?.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    const response = await this.client.chat.completions.create(params);

    return {
      content: response.choices[0]?.message?.content ?? "",
      provider: this.name,
      model,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): AsyncGenerator<string> {
    const openaiMessages = messages.map((message) => ({
      role: ["system", "user", "assistant"].includes(message.role)
        ? (message.role as "system" | "user" | "assistant")
        : "user",
      content: ["system", "user", "assistant"].includes(message.role)
        ? message.content
        : `[${message.role}] ${message.content}`,
    }));

    const params: any = {
      model,
      messages: openaiMessages,
      stream: true,
    };

    if (options?.maxTokens) {
      params.max_tokens = options.maxTokens;
    }

    if (options?.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    const stream = await this.client.chat.completions.create(params);

    const asyncIterableStream =
  stream as unknown as AsyncIterable<any>;
  

for await (const chunk of asyncIterableStream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
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