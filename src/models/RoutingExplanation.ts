export interface ScoreBreakdown {
    priority: number;
    capability: number;
    cost: number;
    latency: number;
    context: number;
}

export interface RoutingExplanation {
    provider: string;
    model: string;
    policy: string;

    totalScore: number;

    breakdown: ScoreBreakdown;
}