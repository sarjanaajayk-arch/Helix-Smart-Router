import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

const MAX_JSON_BYTES = 10 * 1024 * 1024;
const UNSAFE_PATH_PATTERN = /(?:\.\.|%2e|%2f|%5c|%00|[\u0000-\u001f])/i;

function reject(req: Request, res: Response, status: number, message: string, code: string): void {
    helixLogger.warn("Request rejected by security gate", {
        requestId: req.requestId,
        path: req.originalUrl,
        method: req.method,
        status,
        code,
    });

    res.status(status).json({
        error: {
            message,
            type: status === 415 ? "invalid_request_error" : "invalid_request_error",
            code,
            request_id: req.requestId,
        },
    });
}

export function requestSecurityMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const path = `${req.originalUrl} ${req.url}`;
    if (UNSAFE_PATH_PATTERN.test(path)) {
        reject(req, res, 400, "Invalid request path.", "invalid_request");
        return;
    }

    const contentLength = Number(req.headers["content-length"] ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) {
        reject(req, res, 413, "Request payload too large.", "request_too_large");
        return;
    }

    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const contentType = req.headers["content-type"];
    if (hasBody && contentLength > 0 && (typeof contentType !== "string" || !/^application\/(?:json|[^;]+\+json)(?:\s*;|$)/i.test(contentType))) {
        reject(req, res, 415, "Unsupported content type. Use application/json.", "unsupported_media_type");
        return;
    }

    next();
}

export function requestSecurityErrorHandler(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error?.type === "entity.too.large" || error?.status === 413) {
        reject(req, res, 413, "Request payload too large.", "request_too_large");
        return;
    }

    if (error instanceof SyntaxError && "body" in error) {
        reject(req, res, 400, "Malformed JSON request.", "invalid_json");
        return;
    }

    next(error);
}

export const REQUEST_BODY_LIMIT = `${MAX_JSON_BYTES}b`;
