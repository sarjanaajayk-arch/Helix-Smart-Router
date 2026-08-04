import { Organization } from "../models/Organization";

export interface OrganizationRepository {
    create(
        organization: Organization
    ): Promise<Organization>;

    findById(
        id: string
    ): Promise<Organization | null>;

    findBySlug(
        slug: string
    ): Promise<Organization | null>;

    list(): Promise<Organization[]>;

    update(
        organization: Organization
    ): Promise<Organization>;

    delete(
        id: string
    ): Promise<void>;
}