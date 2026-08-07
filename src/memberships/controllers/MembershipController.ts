import { Request, Response } from "express";

import { MembershipService } from "../services/MembershipService";

export class MembershipController {

    constructor(
        private readonly membershipService: MembershipService
    ) {}

    /**
     * POST /memberships
     */
    addMember = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const membership =
                await this.membershipService.addMember(req.body);

            res.status(201).json(membership);

        } catch (error: any) {

            res.status(400).json({
                error: error.message,
            });

        }

    };

    /**
     * GET /organizations/:organizationId/members
     */
    listOrganizationMembers = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const organizationId = Array.isArray(req.params.organizationId)
            ? req.params.organizationId[0]
            : req.params.organizationId;

        const members =
            await this.membershipService.listOrganizationMembers(
                organizationId
            );

        res.json(members);

    };

    /**
     * GET /users/:userId/memberships
     */
    listUserMemberships = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const userId = Array.isArray(req.params.userId)
            ? req.params.userId[0]
            : req.params.userId;

        const memberships =
            await this.membershipService.listUserMemberships(
                userId
            );

        res.json(memberships);

    };

    /**
     * PATCH /memberships
     */
    updateMember = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const membership =
                await this.membershipService.updateMembership(
                    req.body
                );

            res.json(membership);

        } catch (error: any) {

            res.status(400).json({
                error: error.message,
            });

        }

    };

    /**
     * DELETE /memberships
     */
    removeMember = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            await this.membershipService.removeMember(
                req.body.organizationId,
                req.body.userId
            );

            res.status(204).send();

        } catch (error: any) {

            res.status(404).json({
                error: error.message,
            });

        }

    };

}