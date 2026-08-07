import { ProviderCredentialsService } from "../../byok/services/ProviderCredentialsService";
import { ProviderCredentialContext } from "../../providers/credentials/ProviderCredentialContext";
import { ProviderType } from "../../types/ProviderType";

export class ProviderCredentialResolver {

    constructor(
        private readonly credentialsService: ProviderCredentialsService
    ) {}

    async resolve(
        organizationId: string,
        provider: ProviderType
    ): Promise<ProviderCredentialContext | undefined> {

        const credential =
            await this.credentialsService.getActiveCredential(
                organizationId,
                provider
            );

        if (!credential) {
            return undefined;
        }

        return {
            organizationId,
            provider,
            apiKey: credential.credential,
        };
    }
}