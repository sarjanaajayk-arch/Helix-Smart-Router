import { Pool } from "pg";

import { User } from "../models/User";
import { UserRepository } from "./UserRepository";

export class PostgreSQLUserRepository implements UserRepository {
    constructor(
        private readonly pool: Pool
    ) {}

    async create(user: User): Promise<User> {
        const query = `
            INSERT INTO users (
                id,
                email,
                password_hash,
                full_name,
                created_at,
                updated_at,
                is_active,
                email_verified
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
        `;

        const result = await this.pool.query(query, [
            user.id,
            user.email,
            user.passwordHash,
            user.fullName,
            user.createdAt,
            user.updatedAt,
            user.isActive,
            user.emailVerified,
        ]);

        return this.mapRow(result.rows[0]);
    }

    async findById(id: string): Promise<User | null> {
        const result = await this.pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRow(result.rows[0]);
    }

    async update(user: User): Promise<User> {
        const query = `
            UPDATE users
            SET
                email = $2,
                password_hash = $3,
                full_name = $4,
                updated_at = $5,
                is_active = $6,
                email_verified = $7
            WHERE id = $1
            RETURNING *
        `;

        const result = await this.pool.query(query, [
            user.id,
            user.email,
            user.passwordHash,
            user.fullName,
            user.updatedAt,
            user.isActive,
            user.emailVerified,
        ]);

        return this.mapRow(result.rows[0]);
    }

    async delete(id: string): Promise<void> {
        await this.pool.query(
            `DELETE FROM users WHERE id = $1`,
            [id]
        );
    }

    async existsByEmail(email: string): Promise<boolean> {
        const result = await this.pool.query(
            `SELECT EXISTS(
                SELECT 1
                FROM users
                WHERE email = $1
            )`,
            [email]
        );

        return result.rows[0].exists;
    }

    private mapRow(row: any): User {
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isActive: row.is_active,
            emailVerified: row.email_verified,
        };
    }
}