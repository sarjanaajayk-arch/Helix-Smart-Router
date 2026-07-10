import { AIModel } from "../models/AIModel";

export class ModelScorer {

    static score(model: AIModel): number {

        let score = 0;

        // Priority (0-100)
        score += model.priority;

        // Context Window Bonus
        score += model.contextWindow / 100000;

        // Structured Output Bonus
        if (model.capabilities.supportsStructuredOutput) {
            score += 10;
        }

        // Function Calling Bonus
        if (model.capabilities.supportsFunctionCalling) {
            score += 10;
        }

        // Vision Bonus
        if (model.capabilities.supportsVision) {
            score += 5;
        }

        // Reasoning Bonus
        if (model.capabilities.supportsReasoning) {
            score += 15;
        }

        return score;
    }
}