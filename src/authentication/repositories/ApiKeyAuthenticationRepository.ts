import { ApiKey } from "../../apiKeys/models/ApiKey";
import { Organization } from "../../organizations/models/Organization";

export interface ApiKeyAuthenticationRepository {

    findApiKeyByHash(
        keyHash: string
    ): Promise<ApiKey | null>;

    findOrganizationById(
        organizationId: string
    ): Promise<Organization | null>;

    updateLastUsed(
        apiKeyId: string
    ): Promise<void>;
}