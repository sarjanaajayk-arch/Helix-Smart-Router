import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { helixLogger } from "../config/logger";

export interface AuthConfig {
  apiKeys: string[];
  headerName?: string;
  queryParamName?: string;
}

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiKeys: process.env.API_KEYS?.split(",").map((k) => k.trim()) ?? [],
  headerName: "x-api-key",
  queryParamName: "api_key",
};

let authConfig: AuthConfig = DEFAULT_AUTH_CONFIG;

export function configureAuth(config: Partial<AuthConfig>): void {
  authConfig = { ...DEFAULT_AUTH_CONFIG, ...config };

  if (config.apiKeys) {
    authConfig.apiKeys = config.apiKeys;
  }
}

export function getAuthConfig(): Readonly<AuthConfig> {
  return { ...authConfig };
}

function extractApiKey(req: Request): string | undefined {
  const headerName = authConfig.headerName?.toLowerCase();

  if (headerName && req.headers[headerName]) {
    const value = req.headers[headerName];
    return Array.isArray(value) ? value[0] : value;
  }

  const queryParamName = authConfig.queryParamName;

  if (queryParamName) {
    const value = req.query[queryParamName] as
      | string
      | string[]
      | undefined;

    if (value !== undefined) {
      return Array.isArray(value) ? value[0] : String(value);
    }
  }

  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}

function isValidApiKey(apiKey: string): boolean {
  return authConfig.apiKeys.some((validKey) => {
    const provided = Buffer.from(apiKey);
    const expected = Buffer.from(validKey);

    if (provided.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(provided, expected);
  });
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (authConfig.apiKeys.length === 0) {
    helixLogger.warn("Auth middleware active but no API keys configured");
    next();
    return;
  }

  const apiKey = extractApiKey(req);

  if (!apiKey) {
    helixLogger.warn("Authentication failed: Missing API key", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(401).json({
      error: {
        message: "Missing API key",
        type: "authentication_error",
        code: "missing_api_key",
      },
    });

    return;
  }

  if (!isValidApiKey(apiKey)) {
    helixLogger.warn("Authentication failed: Invalid API key", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      keyPrefix: `${apiKey.slice(0, 8)}...`,
    });

    res.status(401).json({
      error: {
        message: "Invalid API key",
        type: "authentication_error",
        code: "invalid_api_key",
      },
    });

    return;
  }

  req.apiKey = apiKey;

  helixLogger.debug("Authentication successful", {
    requestId: req.requestId,
    path: req.originalUrl,
    keyPrefix: `${apiKey.slice(0, 8)}...`,
  });

  next();
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (authConfig.apiKeys.length === 0) {
    next();
    return;
  }

  const apiKey = extractApiKey(req);

  if (apiKey && isValidApiKey(apiKey)) {
    req.apiKey = apiKey;

    helixLogger.debug("Optional authentication successful", {
      requestId: req.requestId,
      keyPrefix: `${apiKey.slice(0, 8)}...`,
    });
  }

  next();
}

declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}