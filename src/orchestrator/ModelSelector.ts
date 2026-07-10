import { TaskType } from "../types/TaskType";

export class ModelSelector {

    static select(
        provider: string,
        task: TaskType
    ): string {

        switch (provider) {

            case "gemini":

                switch (task) {

                    case TaskType.CODE:
                        return "gemini-2.5-pro";

                    case TaskType.VISION:
                        return "gemini-2.5-pro";

                    case TaskType.REASONING:
                        return "gemini-2.5-pro";

                    default:
                        return "gemini-2.5-flash";
                }

            case "openrouter":

                switch (task) {

                    case TaskType.CODE:
                        return "anthropic/claude-sonnet-4";

                    case TaskType.REASONING:
                        return "openai/gpt-4.1";

                    default:
                        return "openai/gpt-4.1-mini";
                }

            default:
                return "";
        }

    }

}