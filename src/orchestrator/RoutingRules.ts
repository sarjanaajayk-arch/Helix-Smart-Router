import { TaskType } from "../types/TaskType";

export class RoutingRules {

    private static readonly DEFAULT_PROVIDER = "gemini";

    private static readonly DEFAULT_MODEL = "gemini-2.5-flash";

    static selectProvider(taskType: TaskType): string {
        switch (taskType) {
            case TaskType.CHAT:
            case TaskType.CODE:
            case TaskType.REASONING:
            case TaskType.VISION:
                return this.DEFAULT_PROVIDER;

            default:
                return this.DEFAULT_PROVIDER;
        }
    }

    static selectModel(taskType: TaskType): string {
        switch (taskType) {
            case TaskType.CHAT:
            case TaskType.CODE:
            case TaskType.REASONING:
            case TaskType.VISION:
                return this.DEFAULT_MODEL;

            default:
                return this.DEFAULT_MODEL;
        }
    }
}