import { Request, Response } from "express";

import { ApiKeyService } from "../services/ApiKeyService";

export class ApiKeyController {

    constructor(
        private readonly apiKeyService: ApiKeyService
    ) {}

    /**
     * POST /api-keys
     */
    create = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {
            
            const {
                organizationId,
                name,
            } = req.body;

            const result =
                await this.apiKeyService.createApiKey(
                    organizationId,
                    name
                );

            res.status(201).json(result);

        } catch (error: any) {

            res.status(400).json({
                error: error.message,
            });

        }
    };

    /**
     * GET /api-keys/:id
     */
    getById = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const apiKey =
                await this.apiKeyService.getApiKey(
                    req.params.id as string
                );

            res.json(apiKey);

        } catch (error: any) {

            res.status(404).json({
                error: error.message,
            });

        }
    };

    /**
     * GET /api-keys/organization/:organizationId
     */
    listByOrganization = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const apiKeys =
            await this.apiKeyService.listApiKeys(
                req.params.organizationId as string
            );

        res.json(apiKeys);

    };

    /**
     * PATCH /api-keys/:id/disable
     */
    disable = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const apiKey =
                await this.apiKeyService.disableApiKey(
                    req.params.id as string
                );

            res.json(apiKey);

        } catch (error: any) {

            res.status(404).json({
                error: error.message,
            });

        }
    };

    /**
     * DELETE /api-keys/:id
     */
    delete = async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            await this.apiKeyService.deleteApiKey(
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