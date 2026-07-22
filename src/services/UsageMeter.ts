import { helixLogger } from "../config/logger";
import { ProviderType } from "../types/ProviderType";
import { getModelPricing, calculateCost, ModelPricing } from "../config/pricing";
import { TokenAccounting } from "../orchestrator/TokenAccounting";

export interface UsageRecord {
    requestId: string;
    apiKeyId: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    latencyMs: number;
    success: boolean;
    timestamp: Date;
    errorMessage?: string;
}

export interface UsageSummary {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalEstimatedCost: number;
    averageLatencyMs: number;
    byProvider: Record<string, {
        requests: number;
        tokens: number;
        cost: number;
    }>;
    byModel: Record<string, {
        requests: number;
        tokens: number;
        cost: number;
    }>;
}

export interface UsageQueryOptions {
    apiKeyId?: string;
    provider?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

class UsageMeter {
    private usageRecords: UsageRecord[] = [];
    private readonly maxRecords = 100000; // In-memory limit, would use DB in production

    /**
     * Record usage for a completed request
     */
    recordUsage(record: UsageRecord): void {
        this.usageRecords.push(record);
        
        // Trim old records if we exceed max
        if (this.usageRecords.length > this.maxRecords) {
            this.usageRecords = this.usageRecords.slice(-this.maxRecords);
        }

        helixLogger.info("Usage recorded", {
            requestId: record.requestId,
            apiKeyId: record.apiKeyId,
            provider: record.provider,
            model: record.model,
            totalTokens: record.totalTokens,
            estimatedCost: record.estimatedCost,
            latencyMs: record.latencyMs,
            success: record.success
        });
    }

    /**
     * Record usage from a request/response
     */
    recordRequestUsage(params: {
        requestId: string;
        apiKeyId: string;
        provider: string;
        model: string;
        prompt: string;
        response: string;
        latencyMs: number;
        success: boolean;
        errorMessage?: string;
    }): void {
        const promptTokens = TokenAccounting.estimateTokens(params.prompt);
        const completionTokens = TokenAccounting.estimateTokens(params.response);
        const totalTokens = promptTokens + completionTokens;

        const pricing = getModelPricing(params.provider, params.model);
        const estimatedCost = pricing 
            ? calculateCost(pricing, promptTokens, completionTokens)
            : 0;

        const record: UsageRecord = {
            requestId: params.requestId,
            apiKeyId: params.apiKeyId,
            provider: params.provider,
            model: params.model,
            promptTokens,
            completionTokens,
            totalTokens,
            estimatedCost,
            latencyMs: params.latencyMs,
            success: params.success,
            timestamp: new Date(),
            errorMessage: params.errorMessage
        };

        this.recordUsage(record);
    }

    /**
     * Get usage records with filtering
     */
    getUsage(options: UsageQueryOptions = {}): UsageRecord[] {
        let records = [...this.usageRecords];

        if (options.apiKeyId) {
            records = records.filter(r => r.apiKeyId === options.apiKeyId);
        }
        if (options.provider) {
            records = records.filter(r => r.provider === options.provider);
        }
        if (options.model) {
            records = records.filter(r => r.model === options.model);
        }
        if (options.startDate) {
            records = records.filter(r => r.timestamp >= options.startDate!);
        }
        if (options.endDate) {
            records = records.filter(r => r.timestamp <= options.endDate!);
        }

        // Sort by timestamp descending (newest first)
        records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (options.offset) {
            records = records.slice(options.offset);
        }
        if (options.limit) {
            records = records.slice(0, options.limit);
        }

        return records;
    }

    /**
     * Get usage summary for an API key or overall
     */
    getSummary(apiKeyId?: string): UsageSummary {
        let records = this.usageRecords;
        if (apiKeyId) {
            records = records.filter(r => r.apiKeyId === apiKeyId);
        }

        const summary: UsageSummary = {
            totalRequests: records.length,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalEstimatedCost: 0,
            averageLatencyMs: 0,
            byProvider: {},
            byModel: {}
        };

        let totalLatency = 0;

        for (const record of records) {
            summary.totalTokens += record.totalTokens;
            summary.totalPromptTokens += record.promptTokens;
            summary.totalCompletionTokens += record.completionTokens;
            summary.totalEstimatedCost += record.estimatedCost;
            totalLatency += record.latencyMs;

            if (record.success) {
                summary.successfulRequests++;
            } else {
                summary.failedRequests++;
            }

            // By provider
            if (!summary.byProvider[record.provider]) {
                summary.byProvider[record.provider] = { requests: 0, tokens: 0, cost: 0 };
            }
            summary.byProvider[record.provider].requests++;
            summary.byProvider[record.provider].tokens += record.totalTokens;
            summary.byProvider[record.provider].cost += record.estimatedCost;

            // By model
            if (!summary.byModel[record.model]) {
                summary.byModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
            }
            summary.byModel[record.model].requests++;
            summary.byModel[record.model].tokens += record.totalTokens;
            summary.byModel[record.model].cost += record.estimatedCost;
        }

        summary.averageLatencyMs = records.length > 0 ? totalLatency / records.length : 0;

        return summary;
    }

    /**
     * Get usage for a specific API key
     */
    getUsageByApiKey(apiKeyId: string, options: UsageQueryOptions = {}): UsageRecord[] {
        return this.getUsage({ ...options, apiKeyId });
    }

    /**
     * Clear all usage records (for testing)
     */
    clear(): void {
        this.usageRecords = [];
    }
}

export const usageMeter = new UsageMeter();
