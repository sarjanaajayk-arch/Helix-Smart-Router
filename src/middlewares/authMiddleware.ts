import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { helixLogger } from "../config/logger";
import { database } from "../database/Database";
import { PostgreSQLApiKeyRepository } from "../apiKeys/repositories/PostgreSQLApiKeyRepository";

const apiKeyRepository = new PostgreSQLApiKeyRepository(database);

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

/**
 * Generates a standard SHA-256 hex hash from the raw API key
 */
function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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

  try {
    const keyHash = hashApiKey(apiKey);
    const apiKeyRecord = await apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      helixLogger.warn("Authentication failed: Invalid or inactive API key", {
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
  } catch (error) {
    helixLogger.error("Authentication error during DB lookup", {
      error,
      requestId: req.requestId,
      path: req.originalUrl,
    });

    res.status(500).json({
      error: {
        message: "Internal server error during authentication",
        type: "api_error",
        code: "auth_internal_error",
      },
    });
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (apiKey) {
    try {
      const keyHash = hashApiKey(apiKey);
      const apiKeyRecord = await apiKeyRepository.findByKeyHash(keyHash);

      if (apiKeyRecord && apiKeyRecord.isActive) {
        req.apiKey = apiKey;

        helixLogger.debug("Optional authentication successful", {
          requestId: req.requestId,
          keyPrefix: `${apiKey.slice(0, 8)}...`,
        });
      }
    } catch (error) {
      helixLogger.warn("Optional authentication check failed in DB", {
        error,
        requestId: req.requestId,
      });
    }
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