import { AIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";

export class ProviderManager {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map();

    this.providers.set("gemini", new GeminiProvider());
  }

  getProvider(name: string): AIProvider {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`Provider '${name}' not found.`);
    }

    return provider;
  }
}

export const providerManager = new ProviderManager();