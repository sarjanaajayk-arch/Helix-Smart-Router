import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  let logged = false;

  const logRequest = (event: "finish" | "close"): void => {
    if (logged) {
      return;
    }

    logged = true;

    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    helixLogger.http("HTTP Request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      event,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      contentLength: res.getHeader("content-length"),
    });
  };

  res.once("finish", () => logRequest("finish"));
  res.once("close", () => logRequest("close"));

  next();
}