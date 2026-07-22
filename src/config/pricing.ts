export interface ModelPricing {
    inputPricePerMillionTokens: number;
    outputPricePerMillionTokens: number;
}

export interface ProviderPricing {
    [modelId: string]: ModelPricing;
}

export interface PricingConfig {
    [provider: string]: ProviderPricing;
}

export const DEFAULT_PRICING: PricingConfig = {
    gemini: {
        "gemini-1.5-pro": {
            inputPricePerMillionTokens: 3.50,
            outputPricePerMillionTokens: 10.50
        },
        "gemini-1.5-flash": {
            inputPricePerMillionTokens: 0.075,
            outputPricePerMillionTokens: 0.30
        },
        "gemini-1.0-pro": {
            inputPricePerMillionTokens: 0.50,
            outputPricePerMillionTokens: 1.50
        }
    },
    openrouter: {
        "openai/gpt-4o": {
            inputPricePerMillionTokens: 5.00,
            outputPricePerMillionTokens: 15.00
        },
        "openai/gpt-4o-mini": {
            inputPricePerMillionTokens: 0.15,
            outputPricePerMillionTokens: 0.60
        },
        "anthropic/claude-3.5-sonnet": {
            inputPricePerMillionTokens: 3.00,
            outputPricePerMillionTokens: 15.00
        },
        "anthropic/claude-3-haiku": {
            inputPricePerMillionTokens: 0.25,
            outputPricePerMillionTokens: 1.25
        }
    }
};

export function getModelPricing(provider: string, modelId: string): ModelPricing | null {
    const providerPricing = DEFAULT_PRICING[provider];
    if (!providerPricing) return null;
    
    // Try exact match first
    if (providerPricing[modelId]) {
        return providerPricing[modelId];
    }
    
    // Try partial match for model families
    for (const [key, pricing] of Object.entries(providerPricing)) {
        if (modelId.includes(key) || key.includes(modelId)) {
            return pricing;
        }
    }
    
    return null;
}

export function calculateCost(
    pricing: ModelPricing,
    promptTokens: number,
    completionTokens: number
): number {
    const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePerMillionTokens;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputPricePerMillionTokens;
    return inputCost + outputCost;
}
