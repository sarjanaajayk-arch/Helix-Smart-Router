import { AIModel } from "../models/AIModel";
import { ModelRegistryService } from "../registry/ModelRegistryService";
import { TaskType } from "../types/TaskType";
import { ModelScorer } from "./ModelScorer";

export class ModelSelector {

    public static select(
        provider: string,
        task: TaskType,
        estimatedTokens: number
    ): string {

        const models = ModelRegistryService
            .getEnabledModels()
            .filter(model =>
                model.provider.toLowerCase() === provider.toLowerCase()
            );

        if (models.length === 0) {
            return "";
        }

        // Keep only models that support the task
        // and have enough context window.
        const candidates = models.filter(model =>
            this.matchesTask(model, task) &&
            model.contextWindow >= estimatedTokens
        );

        // If no model can fit the request,
        // return the model with the largest context window.
        if (candidates.length === 0) {

            const fallback = [...models].sort(
                (a, b) => b.contextWindow - a.contextWindow
            );

            return fallback[0].id;
        }

        // Score eligible models.
        candidates.sort(
            (a, b) => ModelScorer.score(b) - ModelScorer.score(a)
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