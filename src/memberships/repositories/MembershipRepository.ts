import { Membership } from "../models/Membership";

export interface MembershipRepository {

    create(
        membership: Membership
    ): Promise<Membership>;

    findMembership(
        organizationId: string,
        userId: string
    ): Promise<Membership | null>;

    findByOrganizationId(
        organizationId: string
    ): Promise<Membership[]>;

    findByUserId(
        userId: string
    ): Promise<Membership[]>;

    update(
        membership: Membership
    ): Promise<Membership>;

    delete(
        organizationId: string,
        userId: string
    ): Promise<void>;
}