import { Request, Response } from 'express';

import { ProviderCredentialsService } from '../services/ProviderCredentialsService';

export class ProviderCredentialsController {
    constructor(
        private readonly service: ProviderCredentialsService
    ) {}

    /**
     * Safely extract a route parameter.
     */
    private getParam(value: string | string[] | undefined): string {
        if (!value) {
            throw new Error('Missing route parameter.');
        }

        return Array.isArray(value) ? value[0] : value;
    }

    public createCredential = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const userId = this.getParam(req.params.userId);

            const credential = await this.service.createCredential(
                userId,
                req.body
            );

            res.status(201).json(credential);
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };

    public listCredentials = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const userId = this.getParam(req.params.userId);

            const credentials = await this.service.listCredentials(userId);

            res.status(200).json(credentials);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };

    public getCredential = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const id = this.getParam(req.params.id);

            const credential = await this.service.getCredential(id);

            if (!credential) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found.'
                });
                return;
            }

            res.status(200).json(credential);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };

    public updateCredential = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const id = this.getParam(req.params.id);

            const credential = await this.service.updateCredential(
                id,
                req.body
            );

            if (!credential) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found.'
                });
                return;
            }

            res.status(200).json(credential);
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };

    public deleteCredential = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const id = this.getParam(req.params.id);

            const deleted = await this.service.deleteCredential(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found.'
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };

    public testCredential = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const id = this.getParam(req.params.id);

            const result = await this.service.testCredential(id);

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error.'
            });
        }
    };
}