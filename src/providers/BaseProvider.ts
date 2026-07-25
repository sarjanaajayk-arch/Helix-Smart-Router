import { AIProvider, ChatMessage, ChatResponse, AIModelInfo } from "./AIProvider";
import { GenerationOptions } from "./AIProvider";

export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;

  abstract chat(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): Promise<ChatResponse>;

  abstract chatStream(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): AsyncGenerator<string>;

  abstract generateStream(
    messages: ChatMessage[],
    model: string,
    options?: GenerationOptions
  ): AsyncGenerator<string>;

  /**
   * Get available models from the provider
   * Default implementation returns empty array - providers should override
   */
  async getAvailableModels(): Promise<Array<{ id: string; name: string; contextWindow: number; maxOutputTokens: number; supportsChat: boolean; supportsVision: boolean; supportsStreaming: boolean; supportsFunctionCalling: boolean; supportsReasoning: boolean; supportsCoding: boolean; inputPricePerMillionTokens?: number; outputPricePerMillionTokens?: number }>> {
    return [];
  }

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}
