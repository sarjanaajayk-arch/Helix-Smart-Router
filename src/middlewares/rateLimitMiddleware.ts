import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  headerName?: string;
  queryParamName?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response, next: NextFunction) => void;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each key to 100 requests per windowMs
  headerName: "x-rate-limit-remaining",
  queryParamName: "api_key",
};

let rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG;

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every minute
setInterval(cleanupExpiredEntries, 60 * 1000);

export function configureRateLimit(config: Partial<RateLimitConfig>): void {
  rateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  if (config.keyGenerator) {
    rateLimitConfig.keyGenerator = config.keyGenerator;
  }
  if (config.skip) {
    rateLimitConfig.skip = config.skip;
  }
  if (config.handler) {
    rateLimitConfig.handler = config.handler;
  }
}

export function getRateLimitConfig(): Readonly<RateLimitConfig> {
  return { ...rateLimitConfig };
}

function getDefaultKey(req: Request): string {
  // Use API key from auth middleware if available
  if ((req as any).apiKey) {
    return `apikey:${(req as any).apiKey}`;
  }
  // Fallback to IP address
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

function defaultSkip(req: Request): boolean {
  // Skip rate limiting for health checks
  if (req.path === "/health" || req.path === "/") {
    return true;
  }
  return false;
}

function defaultHandler(req: Request, res: Response, next: NextFunction): void {
  const key = rateLimitConfig.keyGenerator ? rateLimitConfig.keyGenerator(req) : getDefaultKey(req);
  const entry = rateLimitStore.get(key);
  const retryAfter = entry ? Math.ceil((entry.resetTime - Date.now()) / 1000) : 0;

  helixLogger.warn("Rate limit exceeded", {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    keyPrefix: key.substring(0, 20) + "...",
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
  // Check if rate limiting should be skipped
  if (rateLimitConfig.skip && rateLimitConfig.skip(req)) {
    next();
    return;
  }

  // Generate key for this request
  const key = rateLimitConfig.keyGenerator
    ? rateLimitConfig.keyGenerator(req)
    : getDefaultKey(req);

  const now = Date.now();
  const windowMs = rateLimitConfig.windowMs;
  const max = rateLimitConfig.max;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window has expired
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  } else {
    // Increment count
    entry.count++;
  }

  // Set rate limit headers
  const remaining = Math.max(0, max - entry.count);
  const resetTime = Math.ceil(entry.resetTime / 1000);

  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(resetTime));

  // Check if limit exceeded
  if (entry.count > max) {
    if (rateLimitConfig.handler) {
      rateLimitConfig.handler(req, res, next);
    } else {
      defaultHandler(req, res, next);
    }
    return;
  }

  next();
}

// Cleanup on process exit
process.on("SIGTERM", () => {
  rateLimitStore.clear();
});

process.on("SIGINT", () => {
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
