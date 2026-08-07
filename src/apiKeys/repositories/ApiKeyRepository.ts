import { ApiKey } from "../models/ApiKey";

export interface ApiKeyRepository {

    create(
        apiKey: ApiKey
    ): Promise<ApiKey>;

    findById(
        id: string
    ): Promise<ApiKey | null>;

    findByKeyHash(
        keyHash: string
    ): Promise<ApiKey | null>;

    findByOrganizationId(
        organizationId: string
    ): Promise<ApiKey[]>;

    update(
        apiKey: ApiKey
    ): Promise<ApiKey>;

    delete(
        id: string
    ): Promise<void>;
}