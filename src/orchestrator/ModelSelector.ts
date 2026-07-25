import { AIModel } from "../models/AIModel";
import { ModelRegistryService } from "../registry/ModelRegistryService";
import { TaskType } from "../types/TaskType";
import { ModelScorer } from "./ModelScorer";
import { RoutingPolicy } from "../types/RoutingPolicy";

export class ModelSelector {

    public static select(
        provider: string,
        task: TaskType,
        estimatedTokens: number,
        policy: RoutingPolicy = RoutingPolicy.BALANCED,
        requestedModel?: string
    ): string {
        console.log(`[ModelSelector.select] Input: provider=${provider}, task=${task}, estimatedTokens=${estimatedTokens}, policy=${policy}, requestedModel=${requestedModel}`);

        const models = ModelRegistryService
            .getEnabledModels()
            .filter(model =>
                model.provider.toLowerCase() === provider.toLowerCase()
            );

        if (models.length === 0) {
            console.log(`[ModelSelector.select] No models found for provider ${provider}, returning empty string`);
            return "";
        }

        console.log(`[ModelSelector.select] Available models for provider ${provider}: ${models.map(m => m.id).join(', ')}`);

        // If user requested a specific model that exists and is enabled for this provider, prefer it
        if (requestedModel) {
            const requested = models.find(m => m.id === requestedModel);
            if (requested && this.matchesTask(requested, task) && requested.contextWindow >= estimatedTokens) {
                console.log(`[ModelSelector.select] Using requested model: ${requested.id}`);
                return requested.id;
            } else {
                console.log(`[ModelSelector.select] Requested model ${requestedModel} not found/not suitable, falling back to scoring`);
            }
        }

        const candidates = models.filter(model =>
            this.matchesTask(model, task) &&
            model.contextWindow >= estimatedTokens
        );

        if (candidates.length === 0) {

            const fallback = [...models].sort(
                (a, b) => b.contextWindow - a.contextWindow
            );

            return fallback[0].id;
        }

        candidates.sort(
            (a, b) =>
                ModelScorer.score(b, policy) -
                ModelScorer.score(a, policy)
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
                return model.capabilities.supportsCoding;

            case TaskType.REASONING:
                return model.capabilities.supportsReasoning;

            case TaskType.VISION:
                return model.capabilities.supportsVision;

            default:
                return true;
        }
    }

}