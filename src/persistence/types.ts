export type ApiKeyStatus = "active" | "revoked" | "expired";

export type RequestStatus =
    | "received"
    | "in_progress"
    | "succeeded"
    | "failed"
    | "rejected"
    | "rate_limited"
    | "timed_out";

export interface CustomerRecord {
    id: string;
    externalId: string | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiKeyIdentity {
    id: string;
    customerId: string;
    keyHash: string;
    displayPrefix: string | null;
    name: string | null;
    status: ApiKeyStatus;
    lastUsedAt: Date | null;
    createdAt: Date;
    revokedAt: Date | null;
}

export interface RequestRecord {
    id: string;
    requestId: string;
    customerId: string | null;
    apiKeyId: string | null;
    requestedModel: string | null;
    selectedModel: string | null;
    provider: string | null;
    status: RequestStatus;
    httpStatus: number | null;
    startedAt: Date;
    completedAt: Date | null;
    latencyMs: number | null;
    errorType: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

export interface UsageRecord {
    id: string;
    requestId: string;
    attemptNumber: number;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number | null;
    costCurrency: string;
    recordedAt: Date;
}

export interface FailoverEvent {
    id: string;
    requestId: string;
    attemptNumber: number;
    fromProvider: string;
    toProvider: string;
    fromModel: string | null;
    toModel: string | null;
    reasonCode: string | null;
    reasonMessage: string | null;
    occurredAt: Date;
    metadata: Record<string, unknown> | null;
}

export interface CustomerCreateInput {
    externalId?: string | null;
    name: string;
}

export interface RequestCreateInput {
    requestId: string;
    customerId?: string | null;
    apiKeyId?: string | null;
    requestedModel?: string | null;
    selectedModel?: string | null;
    provider?: string | null;
    status: RequestStatus;
    httpStatus?: number | null;
    startedAt: Date;
}

export interface RequestUpdateInput {
    selectedModel?: string | null;
    provider?: string | null;
    status?: RequestStatus;
    httpStatus?: number | null;
    completedAt?: Date | null;
    latencyMs?: number | null;
    errorType?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
}

export interface UsageRecordInput {
    requestId: string;
    attemptNumber: number;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number | null;
    costCurrency?: string;
    recordedAt?: Date;
}

export interface FailoverEventInput {
    requestId: string;
    attemptNumber: number;
    fromProvider: string;
    toProvider: string;
    fromModel?: string | null;
    toModel?: string | null;
    reasonCode?: string | null;
    reasonMessage?: string | null;
    occurredAt?: Date;
    metadata?: Record<string, unknown> | null;
}
