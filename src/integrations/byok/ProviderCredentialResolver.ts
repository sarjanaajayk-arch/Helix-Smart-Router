import { ProviderCredentialsService } from "../../byok/services/ProviderCredentialsService";
import { ProviderCredentialContext } from "../../providers/credentials/ProviderCredentialContext";
import { ProviderType } from "../../types/ProviderType";

export class ProviderCredentialResolver {
    constructor(
        private readonly credentialsService: ProviderCredentialsService
    ) {}

    async resolve(
        userId: string,
        provider: ProviderType
    ): Promise<ProviderCredentialContext | undefined> {

        const credential =
            await this.credentialsService.getActiveCredential(
                userId,
                provider
            );

        if (!credential) {
            return undefined;
        }

        return {
            userId,
            provider,
            apiKey: credential.credential,
        };
    }
}