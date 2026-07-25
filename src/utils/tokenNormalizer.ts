import { ProviderType } from "../types/ProviderType";

/**
 * Normalizes the maxTokens value for a given model and provider.
 *
 * @param provider - The provider identifier (e.g., "gemini", "openrouter")
 * @param requestedMaxTokens - The max_tokens value from the client request (can be undefined)
 * @param modelMaxOutputTokens - The model's maximum output tokens from the registry (can be undefined if unknown)
 * @returns A safe maxTokens value to use, or undefined if the provider can decide (e.g., OpenRouter)
 */
export function normalizeMaxTokens(
  provider: string,
  requestedMaxTokens?: number,
  modelMaxOutputTokens?: number
): number | undefined {
  // Helper to get a conservative default for the provider
  const getProviderDefault = (p: string): number | undefined => {
    switch (p) {
      case ProviderType.GEMINI:
        // Gemini requires maxOutputTokens; use a conservative default to avoid excessive credit usage
        return 2048;
      case ProviderType.OPENROUTER:
        // OpenRouter (via OpenAI API) does not require max_tokens; let OpenAI decide
        return undefined;
      case ProviderType.GITHUB:
        // GitHub Models API (via OpenAI compatibility) - treat as optional for safety
        return undefined;
      case ProviderType.GROQ:
        // Groq API: max_tokens is optional; if not provided, model generates until max length or stop token
        return undefined;
      default:
        // For unknown providers, return a safe conservative default
        return 2048;
    }
  };

  // If client provided a value, validate and clamp it
  if (requestedMaxTokens !== undefined) {
    // Ensure it's a positive integer
    let validValue = Math.floor(requestedMaxTokens);
    if (isNaN(validValue) || validValue < 1) {
      // Invalid value: fall back to model's max or provider default
      const providerDefault = getProviderDefault(provider);
      const fallback = modelMaxOutputTokens !== undefined
        ? Math.min(modelMaxOutputTokens, providerDefault ?? modelMaxOutputTokens)
        : providerDefault;
      return fallback !== undefined ? Math.max(1, fallback) : undefined;
    }
    // Clamp to the model's maximum output tokens if known
    if (modelMaxOutputTokens !== undefined) {
      validValue = Math.min(validValue, modelMaxOutputTokens);
    }
    // Ensure at least 1
    return Math.max(1, validValue);
  }

  // Client did not provide maxTokens
  const providerDefault = getProviderDefault(provider);
  if (providerDefault !== undefined) {
    // Provider requires an explicit value: use conservative default, clamped to model's limit if known
    let defaultValue = providerDefault;
    if (modelMaxOutputTokens !== undefined) {
      defaultValue = Math.min(defaultValue, modelMaxOutputTokens);
    }
    return Math.max(1, defaultValue);
  }
  // Provider can decide (e.g., OpenRouter via OpenAI API): return undefined so provider uses its own default
  return undefined;
}