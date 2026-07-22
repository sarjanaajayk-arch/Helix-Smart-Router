export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatResponse {
    content: string;
    provider: string;
    model: string;
}

export interface AIModelInfo {
    id: string;
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    supportsChat: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsReasoning: boolean;
    supportsCoding: boolean;
    inputPricePerMillionTokens?: number;
    outputPricePerMillionTokens?: number;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  topK?: number;
}

export interface AIProvider {
  readonly name: string;

  /**
   * Get available models from the provider
   */
  getAvailableModels(): Promise<AIModelInfo[]>;

  /**
   * Standard request-response chat
   */
  chat(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<ChatResponse>;

  /**
   * Streaming chat
   * Returns each generated token/chunk asynchronously.
   */
  chatStream(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): AsyncGenerator<string>;

  /**
   * Generate a stream for OpenAI-compatible streaming
   */
  generateStream(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): AsyncGenerator<string>;
}