import { AIModel } from "../models/AIModel";
import { ModelRegistryService } from "../registry/ModelRegistryService";
import { TaskType } from "../types/TaskType";
import { ModelScorer } from "./ModelScorer";

export class ModelSelector {

    static select(
        provider: string,
        task: TaskType
    ): string {

        const models =
            ModelRegistryService
                .getEnabledModels()
                .filter(model =>
                    model.provider.toLowerCase() === provider.toLowerCase()
                );

        if (models.length === 0) {
            return "";
        }

        const candidates =
            models.filter(model =>
                this.matchesTask(model, task)
            );

        if (candidates.length === 0) {
            return models[0].id;
        }

        candidates.sort(
    (a, b) =>
        ModelScorer.score(b) -
        ModelScorer.score(a)
);
        return candidates[0].id;
    }

    private static matchesTask(
        model: AIModel,
        task: TaskType
    ): boolean {

        switch (task) {

            case TaskType.CHAT:
                return model.capabilities.supportsChat;

            case TaskType.CODE:
                return model.capabilities.supportsReasoning;

            case TaskType.REASONING:
                return model.capabilities.supportsReasoning;

            case TaskType.VISION:
                return model.capabilities.supportsVision;

            default:
                return true;
        }

    }

}