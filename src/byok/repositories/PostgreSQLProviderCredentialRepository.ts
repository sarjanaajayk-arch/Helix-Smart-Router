import { randomUUID } from "crypto";

import { database } from "../../database/Database";

import { ProviderCredentialModel } from "../models/ProviderCredentialModel";
import {
    CredentialStatus,
    ProviderType,
} from "../types/ProviderCredentialTypes";

export class PostgreSQLProviderCredentialRepository {

    private mapRowToModel(
        row: any
    ): ProviderCredentialModel {

        return {
            id: row.id,
            userId: row.user_id,
            provider: row.provider,
            authType: row.auth_type,
            displayName: row.display_name,
            credential: row.encrypted_credential,
            status: row.status,
            metadata: row.metadata ?? {},
            version: row.version,
            deleted: row.deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            lastTestedAt: row.last_tested_at,
        };
    }

    public async create(
        credential: Omit<
            ProviderCredentialModel,
            "id" |
            "version" |
            "deleted" |
            "createdAt" |
            "updatedAt"
        >
    ): Promise<ProviderCredentialModel> {

        const id = randomUUID();

        const now = new Date();

        const result = await database.query(
            `
            INSERT INTO provider_credentials
            (
                id,
                user_id,
                provider,
                auth_type,
                display_name,
                encrypted_credential,
                status,
                metadata,
                version,
                deleted,
                created_at,
                updated_at
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
            RETURNING *
            `,
            [
                id,
                credential.userId,
                credential.provider,
                credential.authType,
                credential.displayName,
                credential.credential,
                credential.status,
                JSON.stringify(credential.metadata ?? {}),
                1,
                false,
                now,
                now,
            ]
        );

        return this.mapRowToModel(result.rows[0]);
    }

    public async findById(
        id: string
    ): Promise<ProviderCredentialModel | null> {

        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE id = $1
            AND deleted = FALSE
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToModel(result.rows[0]);
    }

    public async findByUserId(
        userId: string
    ): Promise<ProviderCredentialModel[]> {

        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE user_id = $1
            AND deleted = FALSE
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return result.rows.map(row => this.mapRowToModel(row));
    }

    public async findByProvider(
        userId: string,
        provider: ProviderType
    ): Promise<ProviderCredentialModel[]> {

        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE user_id = $1
            AND provider = $2
            AND deleted = FALSE
            ORDER BY created_at DESC
            `,
            [
                userId,
                provider,
            ]
        );

        return result.rows.map(row => this.mapRowToModel(row));
    }

    public async update(
        id: string,
        updates: Partial<ProviderCredentialModel>
    ): Promise<ProviderCredentialModel | null> {

        const existing = await this.findById(id);

        if (!existing) {
            return null;
        }

        const updated = {
            ...existing,
            ...updates,
            version: existing.version + 1,
            updatedAt: new Date(),
        };

        const result = await database.query(
            `
            UPDATE provider_credentials
            SET
                user_id = $2,
                provider = $3,
                auth_type = $4,
                display_name = $5,
                encrypted_credential = $6,
                status = $7,
                metadata = $8,
                version = $9,
                deleted = $10,
                created_at = $11,
                updated_at = $12,
                deleted_at = $13,
                last_tested_at = $14
            WHERE id = $1
            RETURNING *
            `,
            [
                id,
                updated.userId,
                updated.provider,
                updated.authType,
                updated.displayName,
                updated.credential,
                updated.status,
                JSON.stringify(updated.metadata ?? {}),
                updated.version,
                updated.deleted,
                updated.createdAt,
                updated.updatedAt,
                updated.deletedAt ?? null,
                updated.lastTestedAt ?? null,
            ]
        );

        return this.mapRowToModel(result.rows[0]);
    }

    public async updateStatus(
        id: string,
        status: CredentialStatus
    ): Promise<ProviderCredentialModel | null> {

        return this.update(id, {
            status,
        });
    }

    public async delete(
        id: string
    ): Promise<boolean> {

        const result = await database.query(
            `
            UPDATE provider_credentials
            SET
                deleted = TRUE,
                deleted_at = NOW(),
                updated_at = NOW(),
                version = version + 1
            WHERE id = $1
            `,
            [id]
        );

        return result.rowCount !== null && result.rowCount > 0;
    }

    public async exists(
        userId: string,
        provider: ProviderType,
        displayName: string
    ): Promise<boolean> {

        const result = await database.query(
            `
            SELECT 1
            FROM provider_credentials
            WHERE
                user_id = $1
                AND provider = $2
                AND display_name = $3
                AND deleted = FALSE
            LIMIT 1
            `,
            [
                userId,
                provider,
                displayName,
            ]
        );

        return result.rows.length > 0;
    }

    public async count(): Promise<number> {

        const result = await database.query(
            `
            SELECT COUNT(*) AS count
            FROM provider_credentials
            WHERE deleted = FALSE
            `
        );

        return Number(result.rows[0].count);
    }
}