import {
    ApiKeyIdentity,
    CustomerCreateInput,
    CustomerRecord,
    FailoverEvent,
    FailoverEventInput,
    RequestCreateInput,
    RequestRecord,
    RequestUpdateInput,
    UsageRecord,
    UsageRecordInput,
} from "./types";

export interface CustomerRepository {
    findById(id: string): Promise<CustomerRecord | null>;
    findByExternalId(externalId: string): Promise<CustomerRecord | null>;
    create(input: CustomerCreateInput): Promise<CustomerRecord>;
}

export interface ApiKeyRepository {
    findByHash(keyHash: string): Promise<ApiKeyIdentity | null>;
}

export interface RequestRepository {
    create(input: RequestCreateInput): Promise<RequestRecord>;
    update(requestId: string, input: RequestUpdateInput): Promise<RequestRecord | null>;
}

export interface UsageRecordRepository {
    insert(input: UsageRecordInput): Promise<UsageRecord>;
}

export interface FailoverEventRepository {
    insert(input: FailoverEventInput): Promise<FailoverEvent>;
}

export interface PersistenceRepositories {
    customers: CustomerRepository;
    apiKeys: ApiKeyRepository;
    requests: RequestRepository;
    usageRecords: UsageRecordRepository;
    failoverEvents: FailoverEventRepository;
}
