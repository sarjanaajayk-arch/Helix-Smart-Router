import { randomUUID } from "crypto";

import { database } from "../../database/Database";

import { ProviderCredentialModel } from "../models/ProviderCredentialModel";
import {
    CredentialStatus,
    ProviderType,
} from "../types/ProviderCredentialTypes";

export abstract class ProviderCredentialRepository {
    public abstract create(
        credential: Omit<
            ProviderCredentialModel,
            "id" | "version" | "deleted" | "createdAt" | "updatedAt"
        >
    ): Promise<ProviderCredentialModel>;

    public abstract findById(id: string): Promise<ProviderCredentialModel | null>;

    public abstract findByOrganizationId(
        organizationId: string
    ): Promise<ProviderCredentialModel[]>;

    public abstract findByProvider(
        organizationId: string,
        provider: ProviderType
    ): Promise<ProviderCredentialModel[]>;

    public abstract update(
        id: string,
        updates: Partial<ProviderCredentialModel>
    ): Promise<ProviderCredentialModel | null>;

    public abstract updateStatus(
        id: string,
        status: CredentialStatus
    ): Promise<ProviderCredentialModel | null>;

    public abstract delete(id: string): Promise<boolean>;

    public abstract exists(
        organizationId: string,
        provider: ProviderType,
        displayName: string
    ): Promise<boolean>;

    public abstract count(): Promise<number>;
}

export class PostgreSQLProviderCredentialRepository extends ProviderCredentialRepository {

    public async create(
        credential: Omit<
            ProviderCredentialModel,
            "id" | "version" | "deleted" | "createdAt" | "updatedAt"
        >
    ): Promise<ProviderCredentialModel> {
        const now = new Date();

        const model: ProviderCredentialModel = {
            ...credential,
            id: randomUUID(),
            version: 1,
            deleted: false,
            createdAt: now,
            updatedAt: now,
        };

        await database.query(
            `
            INSERT INTO provider_credentials (
                id,
                organization_id,
                provider,
                auth_type,
                display_name,
                encrypted_credential,
                status,
                metadata,
                version,
                deleted,
                created_at,
                updated_at,
                deleted_at,
                last_tested_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            `,
            [
                model.id,
                model.organizationId,
                model.provider,
                model.authType,
                model.displayName,
                model.credential,
                model.status,
                JSON.stringify(model.metadata ?? {}),
                model.version,
                model.deleted,
                model.createdAt,
                model.updatedAt,
                model.deletedAt ?? null,
                model.lastTestedAt ?? null,
            ]
        );

        return model;
    }

    public async findById(
        id: string
    ): Promise<ProviderCredentialModel | null> {
        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE id = $1 AND deleted = false
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToModel(result.rows[0]);
    }

    public async findByOrganizationId(
        organizationId: string
    ): Promise<ProviderCredentialModel[]> {
        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE organization_id = $1 AND deleted = false
            ORDER BY created_at DESC
            `,
            [organizationId]
        );

        return result.rows.map((row) => this.mapRowToModel(row));
    }

    public async findByProvider(
        organizationId: string,
        provider: ProviderType
    ): Promise<ProviderCredentialModel[]> {
        const result = await database.query(
            `
            SELECT *
            FROM provider_credentials
            WHERE organization_id = $1 AND provider = $2 AND deleted = false
            ORDER BY created_at DESC
            `,
            [organizationId, provider]
        );

        return result.rows.map((row) => this.mapRowToModel(row));
    }

    public async update(
        id: string,
        updates: Partial<ProviderCredentialModel>
    ): Promise<ProviderCredentialModel | null> {
        const existing = await this.findById(id);

        if (!existing) {
            return null;
        }

        const updated: ProviderCredentialModel = {
            ...existing,
            ...updates,
            version: existing.version + 1,
            updatedAt: new Date(),
        };

        await database.query(
            `
            UPDATE provider_credentials
            SET 
                organization_id = $1,
                provider = $2,
                auth_type = $3,
                display_name = $4,
                encrypted_credential = $5,
                status = $6,
                metadata = $7,
                version = $8,
                deleted = $9,
                updated_at = $10,
                deleted_at = $11,
                last_tested_at = $12
            WHERE id = $13
            `,
            [
                updated.organizationId,
                updated.provider,
                updated.authType,
                updated.displayName,
                updated.credential,
                updated.status,
                JSON.stringify(updated.metadata ?? {}),
                updated.version,
                updated.deleted,
                updated.updatedAt,
                updated.deletedAt ?? null,
                updated.lastTestedAt ?? null,
                id,
            ]
        );

        return updated;
    }

    public async updateStatus(
        id: string,
        status: CredentialStatus
    ): Promise<ProviderCredentialModel | null> {
        return this.update(id, { status });
    }

    public async delete(id: string): Promise<boolean> {
        const now = new Date();

        const result = await database.query(
            `
            UPDATE provider_credentials
            SET deleted = true, deleted_at = $1, updated_at = $1, version = version + 1
            WHERE id = $2 AND deleted = false
            `,
            [now, id]
        );

        return (result.rowCount ?? 0) > 0;
    }

    public async exists(
        organizationId: string,
        provider: ProviderType,
        displayName: string
    ): Promise<boolean> {
        const result = await database.query(
            `
            SELECT 1 
            FROM provider_credentials
            WHERE organization_id = $1 AND provider = $2 AND display_name = $3 AND deleted = false
            LIMIT 1
            `,
            [organizationId, provider, displayName]
        );

        return result.rows.length > 0;
    }

    public async count(): Promise<number> {
        const result = await database.query(
            `
            SELECT COUNT(*) as count
            FROM provider_credentials
            WHERE deleted = false
            `
        );

        return parseInt(result.rows[0]?.count ?? "0", 10);
    }

    protected mapRowToModel(row: any): ProviderCredentialModel {
        return {
            id: row.id,
            organizationId: row.organization_id,
            provider: row.provider,
            authType: row.auth_type,
            displayName: row.display_name,
            credential: row.encrypted_credential,
            status: row.status,
            metadata:
                typeof row.metadata === "string"
                    ? JSON.parse(row.metadata)
                    : row.metadata ?? {},
            version: row.version,
            deleted: row.deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            lastTestedAt: row.last_tested_at,
        };
    }
}