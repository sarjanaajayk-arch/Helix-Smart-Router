import { Router } from "express";

import { database } from "../../database/Database";

import { MembershipController } from "../controllers/MembershipController";
import { PostgreSQLMembershipRepository } from "../repositories/PostgreSQLMembershipRepository";
import { MembershipService } from "../services/MembershipService";

const router = Router();

const membershipRepository =
    new PostgreSQLMembershipRepository(database);

const membershipService =
    new MembershipService(membershipRepository);

const membershipController =
    new MembershipController(membershipService);

/**
 * Add Member
 */
router.post(
    "/",
    membershipController.addMember
);

/**
 * List Organization Members
 */
router.get(
    "/organizations/:organizationId",
    membershipController.listOrganizationMembers
);

/**
 * List User Memberships
 */
router.get(
    "/users/:userId",
    membershipController.listUserMemberships
);

/**
 * Update Membership
 */
router.patch(
    "/",
    membershipController.updateMember
);

/**
 * Remove Member
 */
router.delete(
    "/",
    membershipController.removeMember
);

export default router;