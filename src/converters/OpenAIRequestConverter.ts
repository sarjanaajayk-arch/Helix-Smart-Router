import { RoutingRequest, TaskType } from "../models/RoutingRequest";
import { OpenAIChatRequest, OpenAIMessage } from "../models/OpenAIChatRequest";

export class OpenAIRequestConverter {

    public static toRoutingRequest(openaiRequest: OpenAIChatRequest): RoutingRequest {
        let taskType: TaskType;

        if (openaiRequest.tools?.length) {
            taskType = TaskType.AGENT;
        } else {
            taskType = TaskType.CHAT;
        }

        const routingRequest: RoutingRequest = {
            prompt: this.buildPromptFromMessages(openaiRequest.messages),
            taskType,
            metadata: {
                model: openaiRequest.model,
                temperature: openaiRequest.temperature,
                max_tokens: openaiRequest.max_tokens,
                top_p: openaiRequest.top_p,
                tools: openaiRequest.tools,
                tool_choice: openaiRequest.tool_choice,
                user: openaiRequest.user,
            },
        };

        return routingRequest;
    }

    private static buildPromptFromMessages(messages: OpenAIMessage[]): string {
        const systemMessages = messages.filter(msg => msg.role === "system");
        const userMessages = messages.filter(msg => msg.role === "user");
        const lastUserMessage = userMessages[userMessages.length - 1];

        if (systemMessages.length > 0) {
            return `${systemMessages.map(msg => msg.content).join("\n\n")}\n\n${lastUserMessage.content}`;
        }

        return lastUserMessage.content;
    }
}