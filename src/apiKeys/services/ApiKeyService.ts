import { createHash, randomBytes, randomUUID } from "crypto";

import { ApiKey } from "../models/ApiKey";
import { ApiKeyRepository } from "../repositories/ApiKeyRepository";

export class ApiKeyService {

    constructor(
        private readonly apiKeyRepository: ApiKeyRepository
    ) {}

    /**
     * Generate a new API Key.
     */
    async createApiKey(
        organizationId: string,
        name: string
    ): Promise<{
        apiKey: string;
        record: ApiKey;
    }> {

        if (!organizationId.trim()) {
            throw new Error("Organization ID is required.");
        }

        if (!name.trim()) {
            throw new Error("API Key name is required.");
        }

        const apiKey =
            `helix_sk_${randomBytes(32).toString("hex")}`;

        const keyHash =
            createHash("sha256")
                .update(apiKey)
                .digest("hex");

        const record: ApiKey = {

            id: randomUUID(),

            organizationId,

            name,

            keyHash,

            createdAt: new Date(),

            lastUsedAt: null,

            isActive: true,
        };

        const created =
            await this.apiKeyRepository.create(record);

        return {

            apiKey,

            record: created,
        };
    }

    /**
     * List API Keys for an organization.
     */
    async listApiKeys(
        organizationId: string
    ): Promise<ApiKey[]> {

        return this.apiKeyRepository.findByOrganizationId(
            organizationId
        );
    }

    /**
     * Find API Key by ID.
     */
    async getApiKey(
        id: string
    ): Promise<ApiKey> {

        const apiKey =
            await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new Error("API Key not found.");
        }

        return apiKey;
    }

    /**
     * Disable API Key.
     */
    async disableApiKey(
        id: string
    ): Promise<ApiKey> {

        const apiKey =
            await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new Error("API Key not found.");
        }

        apiKey.isActive = false;

        return this.apiKeyRepository.update(apiKey);
    }

    /**
     * Delete API Key.
     */
    async deleteApiKey(
        id: string
    ): Promise<void> {

        const apiKey =
            await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new Error("API Key not found.");
        }

        await this.apiKeyRepository.delete(id);
    }
}