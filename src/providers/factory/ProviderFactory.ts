import { GeminiProvider } from "../GeminiProvider";
import { OpenRouterProvider } from "../OpenRouterProvider";
import { ProviderType } from "../../types/ProviderType";
import { ProviderCredentialContext } from "../credentials/ProviderCredentialContext";
import { AIProvider } from "../AIProvider";

export class ProviderFactory {
    public static create(
        credential: ProviderCredentialContext
    ): AIProvider {

        console.log("🔥 PROVIDER FACTORY", {
            provider: credential.provider,
            userId: credential.userId,
            apiKeyPrefix: credential.apiKey?.substring(0, 10),
        });

        switch (credential.provider) {
            case ProviderType.GEMINI:
                return new GeminiProvider(
                    credential.apiKey
                );

            case ProviderType.OPENROUTER:
                return new OpenRouterProvider(
                    credential.apiKey
                );

            default:
                throw new Error(
                    `Unsupported provider: ${credential.provider}`
                );
        }
    }
}