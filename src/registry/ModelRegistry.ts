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

        priority: 105,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.10,
        outputPricePerMillionTokens: 0.40,

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
       GITHUB MODELS
    ============================================================ */

    // Best-effort registry rows for GitHub Models.
    // Verify slugs and pricing against your GitHub Models catalog before production use.
    {
        id: "gpt-4.1",
        name: "GPT-4.1",

        provider: ProviderType.GITHUB,

        contextWindow: 1048576,
        maxOutputTokens: 32768,

        priority: 98,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 2.00,
        outputPricePerMillionTokens: 8.00,

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
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",

        provider: ProviderType.GITHUB,

        contextWindow: 1048576,
        maxOutputTokens: 32768,

        priority: 101,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.40,
        outputPricePerMillionTokens: 1.60,

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
        id: "o3",
        name: "OpenAI o3",

        provider: ProviderType.GITHUB,

        contextWindow: 200000,
        maxOutputTokens: 32768,

        priority: 97,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 3.00,
        outputPricePerMillionTokens: 12.00,

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
        id: "deepseek-r1",
        name: "DeepSeek R1",

        provider: ProviderType.GITHUB,

        contextWindow: 164000,
        maxOutputTokens: 32768,

        priority: 96,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.70,
        outputPricePerMillionTokens: 2.50,

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

    /* ============================================================
       GROQ MODELS
    ============================================================ */

    {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",

        provider: ProviderType.GROQ,

        contextWindow: 131072,
        maxOutputTokens: 131072,

        priority: 110,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.05,
        outputPricePerMillionTokens: 0.08,

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
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",

        provider: ProviderType.GROQ,

        contextWindow: 131072,
        maxOutputTokens: 32768,

        priority: 97,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.59,
        outputPricePerMillionTokens: 0.79,

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
        id: "llama-4-scout-17b-16e-instruct",
        name: "Llama 4 Scout",

        provider: ProviderType.GROQ,

        contextWindow: 131072,
        maxOutputTokens: 8192,

        priority: 99,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.11,
        outputPricePerMillionTokens: 0.34,

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
        id: "openai/gpt-oss-120b",
        name: "GPT OSS 120B",

        provider: ProviderType.GROQ,

        contextWindow: 131072,
        maxOutputTokens: 65536,

        priority: 94,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.15,
        outputPricePerMillionTokens: 0.60,

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
        id: "qwen/qwen3-32b",
        name: "Qwen3 32B",

        provider: ProviderType.GROQ,

        contextWindow: 131072,
        maxOutputTokens: 40960,

        priority: 96,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.29,
        outputPricePerMillionTokens: 0.59,

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

    /* ============================================================
       OPENROUTER MODELS
    ============================================================ */

    {
        id: "deepseek/deepseek-chat-v3",
        name: "DeepSeek V3",

        provider: ProviderType.OPENROUTER,

        contextWindow: 164000,
        maxOutputTokens: 8192,

        priority: 90,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.24,
        outputPricePerMillionTokens: 0.90,

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

        contextWindow: 164000,
        maxOutputTokens: 8192,

        priority: 92,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 0.70,
        outputPricePerMillionTokens: 2.50,

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
        id: "anthropic/claude-sonnet-4.6",
        name: "Claude Sonnet 4.6",

        provider: ProviderType.OPENROUTER,

        contextWindow: 1000000,
        maxOutputTokens: 32768,

        priority: 94,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 3.00,
        outputPricePerMillionTokens: 15.00,

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
        id: "anthropic/claude-opus-4.6",
        name: "Claude Opus 4.6",

        provider: ProviderType.OPENROUTER,

        contextWindow: 1000000,
        maxOutputTokens: 32768,

        priority: 88,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 5.00,
        outputPricePerMillionTokens: 25.00,

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
        id: "~anthropic/claude-sonnet-latest",
        name: "Claude Sonnet Latest",

        provider: ProviderType.OPENROUTER,

        contextWindow: 1000000,
        maxOutputTokens: 32768,

        priority: 95,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 2.00,
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

    {
        id: "anthropic/claude-sonnet-4",
        name: "Claude Sonnet 4",

        provider: ProviderType.OPENROUTER,

        contextWindow: 1000000,
        maxOutputTokens: 32768,

        priority: 93,
        temperature: 0.7,

        enabled: true,

        inputPricePerMillionTokens: 3.00,
        outputPricePerMillionTokens: 15.00,

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

];