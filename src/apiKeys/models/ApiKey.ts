export interface ApiKey {

    id: string;

    organizationId: string;

    name: string;

    keyHash: string;

    createdAt: Date;

    lastUsedAt: Date | null;

    isActive: boolean;
}