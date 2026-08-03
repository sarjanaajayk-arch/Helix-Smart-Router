import { ProviderType } from "../types/ProviderType";

export interface ModelDefinition {
    id: string;
    provider: ProviderType;
    displayName: string;
}

export class ModelRegistry {

    private static readonly models: ModelDefinition[] = [

        // -----------------------------
        // Gemini
        // -----------------------------

        {
            id: "gemini-2.5-flash",
            provider: ProviderType.GEMINI,
            displayName: "Gemini 2.5 Flash",
        },

        {
            id: "gemini-2.5-pro",
            provider: ProviderType.GEMINI,
            displayName: "Gemini 2.5 Pro",
        },

        // -----------------------------
        // OpenRouter
        // -----------------------------

        {
            id: "openai/gpt-4o",
            provider: ProviderType.OPENROUTER,
            displayName: "GPT-4o",
        },

        {
            id: "openai/gpt-4o-mini",
            provider: ProviderType.OPENROUTER,
            displayName: "GPT-4o Mini",
        },

        {
            id: "anthropic/claude-3.5-sonnet",
            provider: ProviderType.OPENROUTER,
            displayName: "Claude 3.5 Sonnet",
        },

        {
            id: "deepseek/deepseek-r1",
            provider: ProviderType.OPENROUTER,
            displayName: "DeepSeek R1",
        },
    ];

    public static getProvider(
        modelId: string
    ): ProviderType | undefined {

        return this.models.find(
            model => model.id === modelId
        )?.provider;
    }

    public static getModel(
        modelId: string
    ): ModelDefinition | undefined {

        return this.models.find(
            model => model.id === modelId
        );
    }

    public static getAllModels(): ModelDefinition[] {
        return [...this.models];
    }

    public static hasModel(
        modelId: string
    ): boolean {

        return this.models.some(
            model => model.id === modelId
        );
    }
}