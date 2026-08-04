import { Request, Response } from "express";

import { OrganizationService } from "../services/OrganizationService";

export class OrganizationController {

    constructor(
        private readonly organizationService: OrganizationService
    ) {}

    /**
     * POST /organizations
     */
    register = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const { name, slug } = req.body;

const organization =
    await this.organizationService.createOrganization(
        name,
        slug
    );

            res.status(201).json(organization);

        } catch (error: any) {

            res.status(400).json({
                error: error.message,
            });

        }
    };

    /**
     * GET /organizations/:id
     */
    getById = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const organization =
                await this.organizationService.getOrganization(
    req.params.id as string
);

            res.json(organization);

        } catch (error: any) {
            res.status(404).json({
                error: error.message,
            });

        }
    };

    /**
     * GET /organizations
     */
    list = async (
        _req: Request,
        res: Response
    ): Promise<void> => {

        const organizations =
            await this.organizationService.listOrganizations();

        res.json(organizations);

    };

    /**
     * PATCH /organizations/:id
     */
    update = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const { name, slug } = req.body;

            const organization =
                await this.organizationService.updateOrganization(
    req.params.id as string,
    name,
    slug
);

            res.json(organization);

        } catch (error: any) {

            res.status(400).json({
                error: error.message,
            });

        }
    };

    /**
     * DELETE /organizations/:id
     */
    delete = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

           await this.organizationService.deleteOrganization(
    req.params.id as string
);

            res.status(204).send();

        } catch (error: any) {

            res.status(404).json({
                error: error.message,
            });

        }
    };
}