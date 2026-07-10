import { AIProvider, ChatMessage, ChatResponse } from "./AIProvider";

export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;

  abstract chat(messages: ChatMessage[]): Promise<ChatResponse>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}