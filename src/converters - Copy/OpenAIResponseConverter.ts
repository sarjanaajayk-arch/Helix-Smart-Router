import { RoutingResponse } from "../models/RoutingResponse";
import { OpenAIChatResponse } from "../models/OpenAIChatResponse";

export class OpenAIResponseConverter {
    public static toOpenAIResponse(
        routingResponse: RoutingResponse,
        model: string
    ): OpenAIChatResponse {
        const completionTokens = this.estimateTokens(routingResponse.content);
        const promptTokens = this.estimateTokens(
            routingResponse.content
        );

        return {
            id: this.generateId(),
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: routingResponse.model || model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: routingResponse.content,
                    },
                    finish_reason: "stop",
                },
            ],
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens,
            },
        };
    }

    private static generateId(): string {
        return `chatcmpl-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}`;
    }

    private static estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
}