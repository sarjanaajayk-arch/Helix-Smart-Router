import { Request, Response } from "express";

import { AuthService } from "../services/AuthService";

export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    /**
     * POST /auth/register
     */
    register = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { email, password, fullName } = req.body;

            const result = await this.authService.register(
                email,
                password,
                fullName
            );

            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error
                    ? error.message
                    : "Registration failed",
            });
        }
    };

    /**
     * POST /auth/login
     */
    login = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { email, password } = req.body;

            const result = await this.authService.login(
                email,
                password
            );

            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({
                error: error instanceof Error
                    ? error.message
                    : "Login failed",
            });
        }
    };

    /**
     * GET /auth/me
     */
    me = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const userId = (req as any).user.userId;

            const user = await this.authService.getCurrentUser(
                userId
            );

            res.status(200).json(user);
        } catch (error) {
            res.status(401).json({
                error: error instanceof Error
                    ? error.message
                    : "Unauthorized",
            });
        }
    };
}