import { NextFunction, Request, Response } from 'express';

import { ProviderCredentialRepository } from '../repositories/ProviderCredentialRepository';

export class CredentialOwnershipMiddleware {
    constructor(
        private readonly repository: ProviderCredentialRepository
    ) {}

    /**
     * Ensures that the requested credential belongs to the specified user.
     */
    public verifyOwnership = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = this.getParam(req.params.id);
            const userId = this.getParam(req.params.userId);

            const credential = await this.repository.findById(id);

            if (!credential) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found.'
                });
                return;
            }

            if (credential.organizationId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied.'
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error.'
            });
        }
    };

    private getParam(value: string | string[] | undefined): string {
        if (!value) {
            throw new Error('Missing route parameter.');
        }

        return Array.isArray(value) ? value[0] : value;
    }
}