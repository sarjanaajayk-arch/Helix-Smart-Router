import { Pool } from "pg";

import { ApiKey } from "../../apiKeys/models/ApiKey";
import { Organization } from "../../organizations/models/Organization";

import { ApiKeyAuthenticationRepository } from "./ApiKeyAuthenticationRepository";

export class PostgreSQLApiKeyAuthenticationRepository
    implements ApiKeyAuthenticationRepository {

    constructor(
        private readonly pool: Pool
    ) {}

    async findApiKeyByHash(
        keyHash: string
    ): Promise<ApiKey | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM api_keys
            WHERE key_hash = $1
            `,
            [keyHash]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapApiKey(result.rows[0]);
    }

    async findOrganizationById(
        organizationId: string
    ): Promise<Organization | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organizations
            WHERE id = $1
            `,
            [organizationId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapOrganization(result.rows[0]);
    }

    async updateLastUsed(
        apiKeyId: string
    ): Promise<void> {

        await this.pool.query(
            `
            UPDATE api_keys
            SET last_used_at = NOW()
            WHERE id = $1
            `,
            [apiKeyId]
        );
    }

    private mapApiKey(row: any): ApiKey {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            keyHash: row.key_hash,
            createdAt: row.created_at,
            lastUsedAt: row.last_used_at,
            isActive: row.is_active,
        };
    }

    private mapOrganization(row: any): Organization {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isActive: row.is_active,
        };
    }
}