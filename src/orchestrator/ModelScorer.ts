import { AIModel } from "../models/AIModel";
import { RoutingPolicy } from "../types/RoutingPolicy";

export class ModelScorer {

    static score(
        model: AIModel,
        policy: RoutingPolicy
    ): number {

        switch (policy) {

            case RoutingPolicy.CHEAPEST:
                return this.cheapest(model);

            case RoutingPolicy.FASTEST:
                return this.fastest(model);

            case RoutingPolicy.HIGHEST_QUALITY:
                return this.highestQuality(model);

            case RoutingPolicy.LONG_CONTEXT:
                return this.longContext(model);

            case RoutingPolicy.BALANCED:
            default:
                return this.balanced(model);
        }
    }

    private static balanced(model: AIModel): number {

        let score = 0;

        score += model.priority;

        score += model.contextWindow / 100000;

        if (model.capabilities.supportsStructuredOutput)
            score += 10;

        if (model.capabilities.supportsFunctionCalling)
            score += 10;

        if (model.capabilities.supportsVision)
            score += 5;

        if (model.capabilities.supportsReasoning)
            score += 15;

        if (model.capabilities.supportsCoding)
            score += 10;

        return score;
    }

    private static cheapest(model: AIModel): number {

        return (
            1000 -
            model.inputPricePerMillionTokens -
            model.outputPricePerMillionTokens
        );
    }

    private static fastest(model: AIModel): number {

        return model.priority;
    }

    private static highestQuality(model: AIModel): number {

        let score = 0;

        score += model.priority * 2;

        if (model.capabilities.supportsReasoning)
            score += 50;

        if (model.capabilities.supportsCoding)
            score += 30;

        if (model.capabilities.supportsVision)
            score += 20;

        return score;
    }

    private static longContext(model: AIModel): number {

        return model.contextWindow;
    }

}