import { Pool } from "pg";

import { Organization } from "../models/Organization";
import { OrganizationRepository } from "./OrganizationRepository";

export class PostgreSQLOrganizationRepository
    implements OrganizationRepository {

    constructor(
        private readonly pool: Pool
    ) {}

    async create(
        organization: Organization
    ): Promise<Organization> {

        const result = await this.pool.query(
            `
            INSERT INTO organizations
            (
                id,
                name,
                slug,
                created_at,
                updated_at,
                is_active
            )
            VALUES
            ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                organization.id,
                organization.name,
                organization.slug,
                organization.createdAt,
                organization.updatedAt,
                organization.isActive,
            ]
        );

        return this.mapRow(result.rows[0]);
    }

    async findById(
        id: string
    ): Promise<Organization | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organizations
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async findBySlug(
        slug: string
    ): Promise<Organization | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organizations
            WHERE slug = $1
            `,
            [slug]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async list(): Promise<Organization[]> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organizations
            ORDER BY created_at ASC
            `
        );

        return result.rows.map(row => this.mapRow(row));
    }

    async update(
        organization: Organization
    ): Promise<Organization> {

        const result = await this.pool.query(
            `
            UPDATE organizations
            SET
                name = $2,
                slug = $3,
                updated_at = $4,
                is_active = $5
            WHERE id = $1
            RETURNING *
            `,
            [
                organization.id,
                organization.name,
                organization.slug,
                organization.updatedAt,
                organization.isActive,
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Organization not found.");
        }

        return this.mapRow(result.rows[0]);
    }

    async delete(
        id: string
    ): Promise<void> {

        await this.pool.query(
            `
            DELETE
            FROM organizations
            WHERE id = $1
            `,
            [id]
        );
    }

    private mapRow(row: any): Organization {
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