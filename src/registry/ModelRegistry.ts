import { AIModel } from "../models/AIModel";
import { ProviderType } from "../types/ProviderType";

export const MODEL_REGISTRY: AIModel[] = [

    /* ============================================================
       GEMINI MODELS
    ============================================================ */

    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",

        provider: ProviderType.GEMINI,

        contextWindow: 1048576,
        maxOutputTokens: 8192,

        priority: 100,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.30,
        outputPricePerMillionTokens: 2.50,

        capabilities: {
            supportsChat: true,
            supportsVision: true,
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsStructuredOutput: true,
            supportsReasoning: true,
            supportsCoding: true,
            supportsEmbeddings: false,
            supportsImageGeneration: false,
        },
    },

    {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",

        provider: ProviderType.GEMINI,

        contextWindow: 1048576,
        maxOutputTokens: 65536,

        priority: 95,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 1.25,
        outputPricePerMillionTokens: 10.00,

        capabilities: {
            supportsChat: true,
            supportsVision: true,
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsStructuredOutput: true,
            supportsReasoning: true,
            supportsCoding: true,
            supportsEmbeddings: false,
            supportsImageGeneration: false,
        },
    },

    /* ============================================================
       OPENROUTER MODELS
    ============================================================ */

    {
        id: "deepseek/deepseek-chat-v3",
        name: "DeepSeek V3",

        provider: ProviderType.OPENROUTER,

        contextWindow: 131072,
        maxOutputTokens: 8192,

        priority: 90,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.27,
        outputPricePerMillionTokens: 1.10,

        capabilities: {
            supportsChat: true,
            supportsVision: false,
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsStructuredOutput: true,
            supportsReasoning: true,
            supportsCoding: true,
            supportsEmbeddings: false,
            supportsImageGeneration: false,
        },
    },

    {
        id: "deepseek/deepseek-r1",
        name: "DeepSeek R1",

        provider: ProviderType.OPENROUTER,

        contextWindow: 131072,
        maxOutputTokens: 8192,

        priority: 92,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.55,
        outputPricePerMillionTokens: 2.19,

        capabilities: {
            supportsChat: true,
            supportsVision: false,
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsStructuredOutput: true,
            supportsReasoning: true,
            supportsCoding: true,
            supportsEmbeddings: false,
            supportsImageGeneration: false,
        },
    }

];