import { Pool } from "pg";

import { Membership } from "../models/Membership";
import { MembershipRepository } from "./MembershipRepository";

export class PostgreSQLMembershipRepository
    implements MembershipRepository {

    constructor(
        private readonly pool: Pool
    ) {}

    async create(
        membership: Membership
    ): Promise<Membership> {

        const result = await this.pool.query(
            `
            INSERT INTO organization_members
            (
                organization_id,
                user_id,
                role,
                joined_at
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                membership.organizationId,
                membership.userId,
                membership.role,
                membership.joinedAt,
            ]
        );

        return this.mapRow(result.rows[0]);
    }

    async findMembership(
        organizationId: string,
        userId: string
    ): Promise<Membership | null> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organization_members
            WHERE organization_id = $1
            AND user_id = $2
            `,
            [
                organizationId,
                userId,
            ]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async findByOrganizationId(
        organizationId: string
    ): Promise<Membership[]> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organization_members
            WHERE organization_id = $1
            ORDER BY joined_at ASC
            `,
            [organizationId]
        );

        return result.rows.map(row => this.mapRow(row));
    }

    async findByUserId(
        userId: string
    ): Promise<Membership[]> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM organization_members
            WHERE user_id = $1
            ORDER BY joined_at ASC
            `,
            [userId]
        );

        return result.rows.map(row => this.mapRow(row));
    }

    async update(
        membership: Membership
    ): Promise<Membership> {

        const result = await this.pool.query(
            `
            UPDATE organization_members
            SET
                role = $3
            WHERE
                organization_id = $1
            AND
                user_id = $2
            RETURNING *
            `,
            [
                membership.organizationId,
                membership.userId,
                membership.role,
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Membership not found.");
        }

        return this.mapRow(result.rows[0]);
    }

    async delete(
        organizationId: string,
        userId: string
    ): Promise<void> {

        await this.pool.query(
            `
            DELETE
            FROM organization_members
            WHERE organization_id = $1
            AND user_id = $2
            `,
            [
                organizationId,
                userId,
            ]
        );
    }

    private mapRow(row: any): Membership {

        return {
            organizationId: row.organization_id,
            userId: row.user_id,
            role: row.role,
            joinedAt: row.joined_at,
        };
    }
}