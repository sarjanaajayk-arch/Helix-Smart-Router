import { randomUUID } from "crypto";
import { database } from "../database/Database";
import { UsageRecord } from "../services/UsageMeter";

export class UsageRepository {

    async save(record: UsageRecord): Promise<void> {

        const query = `
            INSERT INTO usage_records (
                id,
                request_id,
                api_key_id,
                provider,
                model,
                prompt_tokens,
                completion_tokens,
                total_tokens,
                estimated_cost,
                latency_ms,
                success,
                error_message,
                created_at
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
            )
        `;

        await database.query(query, [
            randomUUID(),
            record.requestId,
            record.apiKeyId,
            record.provider,
            record.model,
            record.promptTokens,
            record.completionTokens,
            record.totalTokens,
            record.estimatedCost,
            record.latencyMs,
            record.success,
            record.errorMessage ?? null,
            record.timestamp
        ]);
    }

    async findByApiKey(apiKeyId: string) {

        const result = await database.query(
            `
            SELECT *
            FROM usage_records
            WHERE api_key_id = $1
            ORDER BY created_at DESC
            `,
            [apiKeyId]
        );

        return result.rows;
    }

    async findByRequestId(requestId: string) {

        const result = await database.query(
            `
            SELECT *
            FROM usage_records
            WHERE request_id = $1
            LIMIT 1
            `,
            [requestId]
        );

        return result.rows[0] ?? null;
    }

    async getSummary(apiKeyId?: string) {

        if (apiKeyId) {

            const result = await database.query(
                `
                SELECT
                    COUNT(*) AS total_requests,
                    SUM(prompt_tokens) AS prompt_tokens,
                    SUM(completion_tokens) AS completion_tokens,
                    SUM(total_tokens) AS total_tokens,
                    SUM(estimated_cost) AS total_cost,
                    AVG(latency_ms) AS average_latency
                FROM usage_records
                WHERE api_key_id = $1
                `,
                [apiKeyId]
            );

            return result.rows[0];
        }

        const result = await database.query(
            `
            SELECT
                COUNT(*) AS total_requests,
                SUM(prompt_tokens) AS prompt_tokens,
                SUM(completion_tokens) AS completion_tokens,
                SUM(total_tokens) AS total_tokens,
                SUM(estimated_cost) AS total_cost,
                AVG(latency_ms) AS average_latency
            FROM usage_records
            `
        );

        return result.rows[0];
    }
}

export const usageRepository = new UsageRepository();