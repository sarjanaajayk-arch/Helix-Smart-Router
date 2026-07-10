import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export function requestLoggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;

        helixLogger.http("HTTP Request", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration,
        });
    });

    next();
}