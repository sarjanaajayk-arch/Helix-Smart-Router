import { Membership } from "../models/Membership";
import { MembershipRepository } from "../repositories/MembershipRepository";

export class MembershipService {

    constructor(
        private readonly membershipRepository: MembershipRepository
    ) {}

    /**
     * Add user to organization.
     */
    async addMember(
        membership: Membership
    ): Promise<Membership> {

        const existing =
            await this.membershipRepository.findMembership(
                membership.organizationId,
                membership.userId
            );

        if (existing) {
            throw new Error("User is already a member of this organization.");
        }

        return this.membershipRepository.create(
            membership
        );
    }

    /**
     * Get all members of an organization.
     */
    async listOrganizationMembers(
        organizationId: string
    ): Promise<Membership[]> {

        return this.membershipRepository.findByOrganizationId(
            organizationId
        );
    }

    /**
     * Get all organizations a user belongs to.
     */
    async listUserMemberships(
        userId: string
    ): Promise<Membership[]> {

        return this.membershipRepository.findByUserId(
            userId
        );
    }

    /**
     * Change member role.
     */
    async updateMembership(
        membership: Membership
    ): Promise<Membership> {

        const existing =
            await this.membershipRepository.findMembership(
                membership.organizationId,
                membership.userId
            );

        if (!existing) {
            throw new Error("Membership not found.");
        }

        return this.membershipRepository.update(
            membership
        );
    }

    /**
     * Remove member from organization.
     */
    async removeMember(
        organizationId: string,
        userId: string
    ): Promise<void> {

        const existing =
            await this.membershipRepository.findMembership(
                organizationId,
                userId
            );

        if (!existing) {
            throw new Error("Membership not found.");
        }

        await this.membershipRepository.delete(
            organizationId,
            userId
        );
    }
}