import { RoutingRequest } from "../models/RoutingRequest";
import { OpenAIChatRequest, OpenAIMessage } from "../models/OpenAIChatRequest";
import { TaskType } from "../types/TaskType";

export class OpenAIRequestConverter {

    public static toRoutingRequest(openaiRequest: OpenAIChatRequest): RoutingRequest {
        console.log(`[OpenAIRequestConverter] Incoming openaiRequest.model: ${openaiRequest.model}`);

        let taskType: TaskType;

        if (openaiRequest.tools?.length) {
            taskType = TaskType.AGENT;
        } else {
            taskType = TaskType.CHAT;
        }

        const routingRequest: RoutingRequest = {
            prompt: this.buildPromptFromMessages(openaiRequest.messages),
            taskType,
            model: openaiRequest.model,
            temperature: openaiRequest.temperature,
            maxTokens: openaiRequest.max_tokens,
            stream: openaiRequest.stream ?? false,
        };

        console.log(`[OpenAIRequestConverter] openaiRequest.max_tokens: ${openaiRequest.max_tokens}`);
        console.log(`[OpenAIRequestConverter] routingRequest.maxTokens: ${routingRequest.maxTokens}`);
        console.log(`[OpenAIRequestConverter] openaiRequest.model: ${openaiRequest.model}`);
        console.log(`[OpenAIRequestConverter] routingRequest.taskType: ${routingRequest.taskType}`);

        return routingRequest;
    }

    private static buildPromptFromMessages(messages: OpenAIMessage[]): string {

        const systemMessages = messages.filter(msg => msg.role === "system");
        const userMessages = messages.filter(msg => msg.role === "user");

        const lastUserMessage = userMessages[userMessages.length - 1];

        if (!lastUserMessage) {
            return "";
        }

        if (systemMessages.length > 0) {
            return `${systemMessages.map(msg => msg.content).join("\n\n")}\n\n${lastUserMessage.content}`;
        }

        return lastUserMessage.content;
    }
}