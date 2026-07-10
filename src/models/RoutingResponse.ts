import { RoutingExplanation } from "./RoutingExplanation";

export interface RoutingResponse {

    content: string;

    provider: string;

    model: string;

    /**
     * Explains why Helix selected this
     * provider and model.
     */
    explanation?: RoutingExplanation;
}