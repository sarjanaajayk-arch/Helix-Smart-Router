import { Request, Response, NextFunction } from "express";

import { JWTService } from "../services/JWTService";

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export function jwtAuthMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authorization = req.header("Authorization");

        if (!authorization) {
            res.status(401).json({
                error: "Authorization header is required.",
            });
            return;
        }

        if (!authorization.startsWith("Bearer ")) {
            res.status(401).json({
                error: "Invalid authorization format.",
            });
            return;
        }

        const token = authorization.substring(7);

        const payload = JWTService.verifyAccessToken(token);

        req.user = {
            userId: payload.userId,
            email: payload.email,
        };

        next();
    } catch (error) {
        res.status(401).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Invalid token.",
        });
    }
}