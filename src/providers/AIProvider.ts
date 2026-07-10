export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;

  chat(messages: ChatMessage[]): Promise<ChatResponse>;
}