import { Request, Response, NextFunction } from "express";

import { database } from "../../database/Database";

import { ApiKeyAuthenticationService } from "../services/ApiKeyAuthenticationService";
import { PostgreSQLApiKeyAuthenticationRepository } from "../repositories/PostgreSQLApiKeyAuthenticationRepository";

const repository =
    new PostgreSQLApiKeyAuthenticationRepository(database);

const authenticationService =
    new ApiKeyAuthenticationService(repository);

export async function apiKeyAuthenticationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {

    try {

        const apiKey =
            req.header("x-api-key");

        if (!apiKey) {
            res.status(401).json({
                error: "Missing API key.",
            });
            return;
        }

        const result =
            await authenticationService.authenticate(
                apiKey
            );

        req.organization = result.organization;
        req.apiKeyRecord = result.apiKey;

        next();

    } catch (error: any) {

        res.status(401).json({
            error: error.message,
        });

    }
}

declare global {
    namespace Express {

        interface Request {

            organization?: import("../../organizations/models/Organization").Organization;

            apiKeyRecord?: import("../../apiKeys/models/ApiKey").ApiKey;

        }

    }
}