import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    req.get("X-Request-ID") ??
    req.get("x-request-id") ??
    randomUUID();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  next();
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}