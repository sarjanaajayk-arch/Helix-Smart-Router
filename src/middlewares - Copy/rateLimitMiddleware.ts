import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
};

let rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredEntries, 60 * 1000);
cleanupTimer.unref();

export function configureRateLimit(
  config: Partial<RateLimitConfig>
): void {
  rateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };
}

export function getRateLimitConfig(): Readonly<RateLimitConfig> {
  return { ...rateLimitConfig };
}

function getDefaultKey(req: Request): string {
  if (req.apiKey) {
    return `apikey:${req.apiKey}`;
  }

  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

function defaultSkip(req: Request): boolean {
  return req.path === "/" || req.path === "/health";
}

function defaultHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = rateLimitConfig.keyGenerator
    ? rateLimitConfig.keyGenerator(req)
    : getDefaultKey(req);

  const entry = rateLimitStore.get(key);

  const retryAfter = entry
    ? Math.max(0, Math.ceil((entry.resetTime - Date.now()) / 1000))
    : 0;

  helixLogger.warn("Rate limit exceeded", {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    identifier: key.startsWith("apikey:") ? "apikey" : req.ip,
    retryAfter,
  });

  res.setHeader("Retry-After", String(retryAfter));

  res.status(429).json({
    error: {
      message: "Too many requests, please try again later",
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
      retry_after: retryAfter,
    },
  });
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const shouldSkip = rateLimitConfig.skip
    ? rateLimitConfig.skip(req)
    : defaultSkip(req);

  if (shouldSkip) {
    next();
    return;
  }

  const key = rateLimitConfig.keyGenerator
    ? rateLimitConfig.keyGenerator(req)
    : getDefaultKey(req);

  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime <= now) {
    entry = {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    };

    rateLimitStore.set(key, entry);
  } else {
    entry.count += 1;
  }

  const remaining = Math.max(
    0,
    rateLimitConfig.max - entry.count
  );

  const reset = Math.ceil(entry.resetTime / 1000);

  req.rateLimitInfo = {
    limit: rateLimitConfig.max,
    remaining,
    reset,
  };

  res.setHeader(
    "X-RateLimit-Limit",
    String(rateLimitConfig.max)
  );

  res.setHeader(
    "X-RateLimit-Remaining",
    String(remaining)
  );

  res.setHeader(
    "X-RateLimit-Reset",
    String(reset)
  );

  if (entry.count > rateLimitConfig.max) {
    const handler = rateLimitConfig.handler ?? defaultHandler;
    handler(req, res, next);
    return;
  }

  next();
}

process.on("SIGTERM", () => {
  cleanupTimer.close();
  rateLimitStore.clear();
});

process.on("SIGINT", () => {
  cleanupTimer.close();
  rateLimitStore.clear();
});

declare global {
  namespace Express {
    interface Request {
      rateLimitInfo?: {
        limit: number;
        remaining: number;
        reset: number;
      };
    }
  }
}