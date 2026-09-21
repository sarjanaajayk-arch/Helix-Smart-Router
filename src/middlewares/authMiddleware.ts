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

const UNSAFE_AUTH_VALUE_PATTERN = /[\u0000-\u001f\u007f]/;
const STRICT_BEARER_PATTERN = /^Bearer [^\s]+$/;

export function configureAuth(config: Partial<AuthConfig>): void {
  authConfig = { ...DEFAULT_AUTH_CONFIG, ...config };
  if (config.apiKeys) {
    authConfig.apiKeys = config.apiKeys;
  }
}

export function getAuthConfig(): Readonly<AuthConfig> {
  return { ...authConfig };
}

function getAuthenticationError(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (authorization === undefined) {
    return null;
  }

  if (
    Array.isArray(authorization) ||
    UNSAFE_AUTH_VALUE_PATTERN.test(authorization) ||
    !STRICT_BEARER_PATTERN.test(authorization)
  ) {
    return "Malformed Authorization header";
  }

  return null;
}

function isSafeCredential(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !UNSAFE_AUTH_VALUE_PATTERN.test(value) &&
    !/\s/.test(value)
  );
}

function extractApiKey(req: Request): string | undefined {
  const headerName = authConfig.headerName?.toLowerCase();
  if (headerName && req.headers[headerName]) {
    const val = req.headers[headerName];
    const candidate = Array.isArray(val) ? val[0] : val;
    return isSafeCredential(candidate) ? candidate : undefined;
  }

  const queryParamName = authConfig.queryParamName;
  if (queryParamName) {
    const queryVal = req.query[queryParamName] as string | string[] | undefined;
    if (queryVal !== undefined) {
      const candidate = Array.isArray(queryVal) ? queryVal[0] : String(queryVal);
      return isSafeCredential(candidate) ? candidate : undefined;
    }
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && STRICT_BEARER_PATTERN.test(authHeader)) {
    return authHeader.slice(7);
  }

  return undefined;
}

function sendAuthenticationError(
  req: Request,
  res: Response,
  message: string,
  code: string
): void {
  const error: {
    message: string;
    type: "authentication_error";
    code: string;
    request_id?: string;
  } = {
    message,
    type: "authentication_error",
    code,
  };

  if (req.requestId) {
    error.request_id = req.requestId;
  }

  res.status(401).json({ error });
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authenticationError = getAuthenticationError(req);
  if (authenticationError) {
    helixLogger.warn("Authentication failed: malformed Authorization header", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
    });
    sendAuthenticationError(req, res, authenticationError, "invalid_authorization");
    return;
  }

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
    sendAuthenticationError(req, res, "Missing API key", "missing_api_key");
    return;
  }

  if (!authConfig.apiKeys.includes(apiKey)) {
    helixLogger.warn("Authentication failed: Invalid API key", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
    });
    sendAuthenticationError(req, res, "Invalid API key", "invalid_api_key");
    return;
  }

  helixLogger.debug("Authentication successful", {
    requestId: req.requestId,
    path: req.originalUrl,
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