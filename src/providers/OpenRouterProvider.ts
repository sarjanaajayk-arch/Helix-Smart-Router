import OpenAI from "openai";

import { BaseProvider } from "./BaseProvider";
import { ChatMessage, ChatResponse, AIModelInfo, GenerationOptions } from "./AIProvider";
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

 async getAvailableModels(): Promise<AIModelInfo[]> {
 try {
 // Fetch models from OpenRouter API
 const response = await this.client.models.list();
 
 // Map OpenRouter models to our AIModelInfo format
 // We'll include some common models with known specs
 const knownModels: Record<string, Partial<AIModelInfo>> = {
 // OpenAI models
 "openai/gpt-4o": { contextWindow: 128000, maxOutputTokens: 4096, inputPricePerMillionTokens: 5.0, outputPricePerMillionTokens: 15.0 },
 "openai/gpt-4o-mini": { contextWindow: 128000, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.15, outputPricePerMillionTokens: 0.6 },
 "openai/gpt-4-turbo": { contextWindow: 128000, maxOutputTokens: 4096, inputPricePerMillionTokens: 10.0, outputPricePerMillionTokens: 30.0 },
 "openai/gpt-3.5-turbo": { contextWindow: 16385, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.5, outputPricePerMillionTokens: 1.5 },
 
 // Anthropic models
 "anthropic/claude-3.5-sonnet": { contextWindow: 200000, maxOutputTokens: 4096, inputPricePerMillionTokens: 3.0, outputPricePerMillionTokens: 15.0 },
 "anthropic/claude-3-opus": { contextWindow: 200000, maxOutputTokens: 4096, inputPricePerMillionTokens: 15.0, outputPricePerMillionTokens: 75.0 },
 "anthropic/claude-3-haiku": { contextWindow: 200000, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.25, outputPricePerMillionTokens: 1.25 },
 
 // Google models
 "google/gemini-pro-1.5": { contextWindow: 32768, maxOutputTokens: 8192, inputPricePerMillionTokens: 0.35, outputPricePerMillionTokens: 1.05 },
 "google/gemini-flash-1.5": { contextWindow: 32768, maxOutputTokens: 8192, inputPricePerMillionTokens: 0.07, outputPricePerMillionTokens: 0.30 },
 
 // Meta models
 "meta-llama/llama-3-70b-instruct": { contextWindow: 8192, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.42, outputPricePerMillionTokens: 0.57 },
 "meta-llama/llama-3-8b-instruct": { contextWindow: 8192, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.06, outputPricePerMillionTokens: 0.09 },
 
 // Mistral models
 "mistralai/mistral-large": { contextWindow: 32768, maxOutputTokens: 4096, inputPricePerMillionTokens: 2.0, outputPricePerMillionTokens: 6.0 },
 "mistralai/mistral-medium": { contextWindow: 32768, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.45, outputPricePerMillionTokens: 1.35 },
 "mistralai/mistral-small": { contextWindow: 32768, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.06, outputPricePerMillionTokens: 0.18 },
 
 // Deepseek models
 "deepseek/deepseek-chat": { contextWindow: 32768, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.27, outputPricePerMillionTokens: 1.10 },
 "deepseek/deepseek-coder": { contextWindow: 32768, maxOutputTokens: 4096, inputPricePerMillionTokens: 0.27, outputPricePerMillionTokens: 1.10 },
 };

 const models: AIModelInfo[] = response.data.map((model: any) => {
 const modelId = model.id;
 const knownSpecs = knownModels[modelId] || {};
 
 return {
 id: modelId,
 name: model.id.replace(/\//g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'), // Convert "google/gemini-pro" to "google gemini pro"
 contextWindow: knownSpecs.contextWindow ?? 32768, // Default fallback
 maxOutputTokens: knownSpecs.maxOutputTokens ?? 4096, // Default fallback
 supportsChat: true,
 supportsVision: modelId.includes('vision') || modelId.includes('vision') || modelId.includes('visual'),
 supportsStreaming: true,
 supportsFunctionCalling: true, // Most models support this via tools
 supportsReasoning: modelId.includes('reasoning') || modelId.includes('o1') || modelId.includes('o3'),
 supportsCoding: modelId.includes('code') || modelId.includes('coder') || modelId.includes('programming'),
 inputPricePerMillionTokens: knownSpecs.inputPricePerMillionTokens,
 outputPricePerMillionTokens: knownSpecs.outputPricePerMillionTokens,
 };
 });

 return models;
 } catch (error) {
 console.error("Failed to fetch OpenRouter models:", error);
 // Return some common models as fallback
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
 inputPricePerMillionTokens: 5.0,
 outputPricePerMillionTokens: 15.0,
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
 inputPricePerMillionTokens: 3.0,
 outputPricePerMillionTokens: 15.0,
 }
 ];
 }
 }

 async chat(
     messages: ChatMessage[],
     model: string,
     options?: GenerationOptions
   ): Promise<ChatResponse> {
     this.log(`Sending request to OpenRouter with model: ${model}...`);

     const openaiMessages = messages.map((message) => {
       let role = message.role;
       let content = message.content;
       if (!['system', 'user', 'assistant'].includes(role)) {
         // Convert non-standard roles to user role and prepend the original role to the content
         role = 'user';
         content = `[${message.role}] ${message.content}`;
       }
       return {
         role: role as "user" | "assistant" | "system",
         content,
       };
     });

     // Build options for OpenAI API call
     const createParams: any = {
       model: model,
       messages: openaiMessages,
     };

     // Pass max_tokens if provided in options
     this.log(`OpenRouterProvider.chat options.maxTokens: ${options?.maxTokens ?? "undefined"}`);
     if (options?.maxTokens) {
       // OpenAI uses max_tokens parameter
       createParams.max_tokens = options.maxTokens;
       this.log(`OpenRouterProvider.chat maxTokens to use: ${options.maxTokens}`);
     }

     if (options?.temperature !== undefined) {
       createParams.temperature = options.temperature;
     }

     this.log(`OpenRouterProvider.chat generationConfig.maxOutputTokens: ${createParams.max_tokens ?? "undefined"}`);
     const response = await this.client.chat.completions.create(createParams);

     return {
       content: response.choices[0]?.message?.content ?? "",
       provider: this.name,
       model: model,
     };
   }

   async *chatStream(
     messages: ChatMessage[],
     model: string,
     options?: GenerationOptions
   ): AsyncGenerator<string> {
     this.log(`Streaming request to OpenRouter with model: ${model}...`);

     const openaiMessages = messages.map((message) => {
       let role = message.role;
       let content = message.content;
       if (!['system', 'user', 'assistant'].includes(role)) {
         // Convert non-standard roles to user role and prepend the original role to the content
         role = 'user';
         content = `[${message.role}] ${message.content}`;
       }
       return {
         role: role as "user" | "assistant" | "system",
         content,
       };
     });

     // Build options for OpenAI API call
     const createParams: any = {
       model: model,
       messages: openaiMessages,
       stream: true,
     };

     // Pass max_tokens if provided in options for streaming as well
     if (options?.maxTokens) {
       createParams.max_tokens = options.maxTokens;
     }

     if (options?.temperature !== undefined) {
       createParams.temperature = options.temperature;
     }

     const stream = await this.client.chat.completions.create(createParams);

     // Cast to AsyncIterable to satisfy TypeScript - the OpenAI SDK v4.x returns an async iterable stream
     const asyncIterableStream = stream as unknown as AsyncIterable<any>;

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
     // For OpenRouter, generateStream is the same as chatStream
     yield* this.chatStream(messages, model, options);
   }
 }
