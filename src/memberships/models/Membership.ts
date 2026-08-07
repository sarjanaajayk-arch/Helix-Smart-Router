export type MembershipRole =
    | "owner"
    | "admin"
    | "member";

export interface Membership {

    organizationId: string;

    userId: string;

    role: MembershipRole;

    joinedAt: Date;
}