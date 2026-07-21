import { Request, Response, NextFunction } from "express";
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
    const val = req.headers[headerName];
    return Array.isArray(val) ? val[0] : val;
  }

  const queryParamName = authConfig.queryParamName;
  if (queryParamName) {
    const queryVal = req.query[queryParamName] as string | string[] | undefined;
    if (queryVal !== undefined) {
      return Array.isArray(queryVal) ? queryVal[0] : String(queryVal);
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
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

  if (!authConfig.apiKeys.includes(apiKey)) {
    helixLogger.warn("Authentication failed: Invalid API key", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      keyPrefix: apiKey.slice(0, 8) + "...",
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

  helixLogger.debug("Authentication successful", {
    requestId: req.requestId,
    path: req.originalUrl,
    keyPrefix: apiKey.slice(0, 8) + "...",
  });

  (req as any).apiKey = apiKey;
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

  if (apiKey && authConfig.apiKeys.includes(apiKey)) {
    (req as any).apiKey = apiKey;
    helixLogger.debug("Optional authentication successful", {
      requestId: req.requestId,
      keyPrefix: apiKey.slice(0, 8) + "...",
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