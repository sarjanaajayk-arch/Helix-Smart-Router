import { ProviderType } from "../types/ProviderType";
import { helixLogger } from "../config/logger";

interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

interface CostBreakdown {
    promptCost: number;
    completionCost: number;
    totalCost: number;
}

interface ProviderPricing {
    inputCostPerMillion: number;
    outputCostPerMillion: number;
}

// Pricing per 1M tokens (USD) - update as needed
const PRICING: Record<ProviderType, ProviderPricing> = {
    [ProviderType.GEMINI]: {
        inputCostPerMillion: 0.075,   // Gemini 2.5 Flash
        outputCostPerMillion: 0.30,
    },
    [ProviderType.OPENROUTER]: {
        inputCostPerMillion: 0.15,    // GPT-4.1-mini via OpenRouter
        outputCostPerMillion: 0.60,
    },
    [ProviderType.GITHUB]: {
        inputCostPerMillion: 0.10,
        outputCostPerMillion: 0.40,
    },
    [ProviderType.GROQ]: {
        inputCostPerMillion: 0.05,
        outputCostPerMillion: 0.05,
    },
};

export class TokenAccounting {
    private static usage: Record<ProviderType, TokenUsage> = {
        [ProviderType.GEMINI]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        [ProviderType.OPENROUTER]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        [ProviderType.GITHUB]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        [ProviderType.GROQ]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };

    private static costs: Record<ProviderType, CostBreakdown> = {
        [ProviderType.GEMINI]: { promptCost: 0, completionCost: 0, totalCost: 0 },
        [ProviderType.OPENROUTER]: { promptCost: 0, completionCost: 0, totalCost: 0 },
        [ProviderType.GITHUB]: { promptCost: 0, completionCost: 0, totalCost: 0 },
        [ProviderType.GROQ]: { promptCost: 0, completionCost: 0, totalCost: 0 },
    };

    static recordUsage(
        provider: ProviderType,
        promptTokens: number,
        completionTokens: number
    ): void {
        const usage = this.usage[provider];
        usage.promptTokens += promptTokens;
        usage.completionTokens += completionTokens;
        usage.totalTokens += promptTokens + completionTokens;

        // Calculate costs
        const pricing = PRICING[provider];
        const promptCost = (promptTokens / 1_000_000) * pricing.inputCostPerMillion;
        const completionCost = (completionTokens / 1_000_000) * pricing.outputCostPerMillion;

        const cost = this.costs[provider];
        cost.promptCost += promptCost;
        cost.completionCost += completionCost;
        cost.totalCost += promptCost + completionCost;

        helixLogger.debug("Token usage recorded", {
            provider,
            promptTokens,
            completionTokens,
            promptCost,
            completionCost,
        });
    }

    static getUsage(provider: ProviderType): TokenUsage {
        return { ...this.usage[provider] };
    }

    static getAllUsage(): Record<ProviderType, TokenUsage> {
        return {
            [ProviderType.GEMINI]: { ...this.usage[ProviderType.GEMINI] },
            [ProviderType.OPENROUTER]: { ...this.usage[ProviderType.OPENROUTER] },
            [ProviderType.GITHUB]: { ...this.usage[ProviderType.GITHUB] },
            [ProviderType.GROQ]: { ...this.usage[ProviderType.GROQ] },
        };
    }

    static getCosts(provider: ProviderType): CostBreakdown {
        return { ...this.costs[provider] };
    }

    static getAllCosts(): Record<ProviderType, CostBreakdown> {
        return {
            [ProviderType.GEMINI]: { ...this.costs[ProviderType.GEMINI] },
            [ProviderType.OPENROUTER]: { ...this.costs[ProviderType.OPENROUTER] },
            [ProviderType.GITHUB]: { ...this.costs[ProviderType.GITHUB] },
            [ProviderType.GROQ]: { ...this.costs[ProviderType.GROQ] },
        };
    }

    static getTotalTokens(): number {
        return Object.values(this.usage).reduce((sum, u) => sum + u.totalTokens, 0);
    }

    static getTotalCost(): number {
        return Object.values(this.costs).reduce((sum, c) => sum + c.totalCost, 0);
    }

    static reset(): void {
        this.usage = {
            [ProviderType.GEMINI]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            [ProviderType.OPENROUTER]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            [ProviderType.GITHUB]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            [ProviderType.GROQ]: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
        this.costs = {
            [ProviderType.GEMINI]: { promptCost: 0, completionCost: 0, totalCost: 0 },
            [ProviderType.OPENROUTER]: { promptCost: 0, completionCost: 0, totalCost: 0 },
            [ProviderType.GITHUB]: { promptCost: 0, completionCost: 0, totalCost: 0 },
            [ProviderType.GROQ]: { promptCost: 0, completionCost: 0, totalCost: 0 },
        };
    }

    static estimateTokens(text: string): number {
        // Rough estimate: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }

    static calculateCost(provider: ProviderType, promptTokens: number, completionTokens: number): CostBreakdown {
        const pricing = PRICING[provider];
        const promptCost = (promptTokens / 1_000_000) * pricing.inputCostPerMillion;
        const completionCost = (completionTokens / 1_000_000) * pricing.outputCostPerMillion;
        return {
            promptCost,
            completionCost,
            totalCost: promptCost + completionCost,
        };
    }

    static getPricing(provider: ProviderType): ProviderPricing {
        return { ...PRICING[provider] };
    }

    static getSummary(): {
        totalTokens: number;
        totalCost: number;
        byProvider: Record<ProviderType, { usage: TokenUsage; cost: CostBreakdown }>;
    } {
        const byProvider: Record<string, { usage: TokenUsage; cost: CostBreakdown }> = {};
        for (const provider of Object.values(ProviderType)) {
            byProvider[provider] = {
                usage: this.getUsage(provider),
                cost: this.getCosts(provider),
            };
        }
        return {
            totalTokens: this.getTotalTokens(),
            totalCost: this.getTotalCost(),
            byProvider: byProvider as Record<ProviderType, { usage: TokenUsage; cost: CostBreakdown }>,
        };
    }
}