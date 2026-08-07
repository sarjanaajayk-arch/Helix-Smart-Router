import { createHash } from "crypto";

import { ApiKey } from "../../apiKeys/models/ApiKey";
import { Organization } from "../../organizations/models/Organization";

import { ApiKeyAuthenticationRepository } from "../repositories/ApiKeyAuthenticationRepository";

export interface AuthenticationResult {
    apiKey: ApiKey;
    organization: Organization;
}

export class ApiKeyAuthenticationService {

    constructor(
        private readonly repository: ApiKeyAuthenticationRepository
    ) {}

    async authenticate(
        apiKey: string
    ): Promise<AuthenticationResult> {

        if (!apiKey) {
            throw new Error("API key is required.");
        }

        if (!apiKey.startsWith("helix_sk_")) {
            throw new Error("Invalid API key format.");
        }

        const keyHash =
            createHash("sha256")
                .update(apiKey)
                .digest("hex");

        const record =
            await this.repository.findApiKeyByHash(keyHash);

        if (!record) {
            throw new Error("Invalid API key.");
        }

        if (!record.isActive) {
            throw new Error("API key is disabled.");
        }

        const organization =
            await this.repository.findOrganizationById(
                record.organizationId
            );

        if (!organization) {
            throw new Error("Organization not found.");
        }

        await this.repository.updateLastUsed(record.id);

        return {
            apiKey: record,
            organization,
        };
    }
}