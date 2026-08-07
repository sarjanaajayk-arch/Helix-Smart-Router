import { Pool } from "pg";

import { ApiKey } from "../models/ApiKey";
import { ApiKeyRepository } from "./ApiKeyRepository";

export class PostgreSQLApiKeyRepository
    implements ApiKeyRepository {

    constructor(
        private readonly pool: Pool
    ) {}

    async create(
        apiKey: ApiKey
    ): Promise<ApiKey> {

        const result = await this.pool.query(
            `
            INSERT INTO api_keys
            (
                id,
                organization_id,
                name,
                key_hash,
                created_at,
                last_used_at,
                is_active
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                apiKey.id,
                apiKey.organizationId,
                apiKey.name,
                apiKey.keyHash,
                apiKey.createdAt,
                apiKey.lastUsedAt,
                apiKey.isActive,
            ]
        );

        return this.mapRow(result.rows[0]);
    }

    async findById(
        id: string
    ): Promise<ApiKey | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM api_keys
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async findByKeyHash(
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

        return this.mapRow(result.rows[0]);
    }

    async findByOrganizationId(
        organizationId: string
    ): Promise<ApiKey[]> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM api_keys
            WHERE organization_id = $1
            ORDER BY created_at ASC
            `,
            [organizationId]
        );

        return result.rows.map(row => this.mapRow(row));
    }

    async update(
        apiKey: ApiKey
    ): Promise<ApiKey> {

        const result = await this.pool.query(
            `
            UPDATE api_keys
            SET
                name = $2,
                key_hash = $3,
                last_used_at = $4,
                is_active = $5
            WHERE id = $1
            RETURNING *
            `,
            [
                apiKey.id,
                apiKey.name,
                apiKey.keyHash,
                apiKey.lastUsedAt,
                apiKey.isActive,
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("API key not found.");
        }

        return this.mapRow(result.rows[0]);
    }

    async delete(
        id: string
    ): Promise<void> {

        await this.pool.query(
            `
            DELETE
            FROM api_keys
            WHERE id = $1
            `,
            [id]
        );
    }

    private mapRow(row: any): ApiKey {

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
}