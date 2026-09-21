import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";
import { ModelRegistryService } from "../registry/ModelRegistryService";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  min?: number;
  max?: number;
  enum?: string[];
  custom?: (value: any) => boolean | string;
  errorCode?: string;
}

export interface ValidationConfig {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

function validateField(
  value: any,
  rule: ValidationRule,
  path: string
): string | null {
  if (rule.required && (value === undefined || value === null || value === "")) {
    return `${path}.${rule.field} is required`;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (rule.type) {
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rule.type) {
      return `${path}.${rule.field} must be of type ${rule.type}, got ${actualType}`;
    }
  }

  if (rule.type === "string" || rule.type === "array") {
    if (rule.min !== undefined && value.length < rule.min) {
      return `${path}.${rule.field} must have at least ${rule.min} items/characters`;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return `${path}.${rule.field} must have at most ${rule.max} items/characters`;
    }
  }

  if (rule.type === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return `${path}.${rule.field} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `${path}.${rule.field} must be at most ${rule.max}`;
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return `${path}.${rule.field} must be one of: ${rule.enum.join(", ")}`;
  }

  if (rule.custom) {
    const result = rule.custom(value);
    if (result !== true) {
      return `${path}.${rule.field}: ${typeof result === "string" ? result : "validation failed"}`;
    }
  }

  return null;
}

const UNSAFE_MODEL_PATTERN = /(?:\.\.[\\/]|[\\/]\.\.|%2e%2e|%2f|%5c|%00|[\u0000-\u001f\u007f]|[\u202a-\u202e\u2066-\u2069])/i;
const UNSAFE_TEXT_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
const MAX_REQUEST_NESTING_DEPTH = 64;

function isRegisteredModel(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return true;
  }

  if (UNSAFE_MODEL_PATTERN.test(value)) {
    return false;
  }

  return ModelRegistryService.getEnabledModels().some((model) => model.id === value);
}

function validateNestedValue(value: unknown, depth: number): string | null {
  if (depth > MAX_REQUEST_NESTING_DEPTH) {
    return `request structure exceeds the maximum nesting depth of ${MAX_REQUEST_NESTING_DEPTH}`;
  }

  if (typeof value === "string") {
    return UNSAFE_TEXT_PATTERN.test(value)
      ? "message content contains unsafe control or bidirectional characters"
      : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const error = validateNestedValue(item, depth + 1);
      if (error) return error;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      const error = validateNestedValue(nestedValue, depth + 1);
      if (error) return error;
    }
  }

  return null;
}

function validateMessages(value: unknown): string | true {
  if (!Array.isArray(value)) {
    return true;
  }

  for (let index = 0; index < value.length; index += 1) {
    const message = value[index];
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      return `body.messages[${index}] must be an object`;
    }

    const messageRecord = message as Record<string, unknown>;
    if (!["system", "user", "assistant"].includes(String(messageRecord.role))) {
      return `body.messages[${index}].role must be system, user, or assistant`;
    }

    if (typeof messageRecord.content !== "string") {
      return `body.messages[${index}].content must be a string`;
    }

    const nestedError = validateNestedValue(message, 0);
    if (nestedError) {
      return `body.messages[${index}]: ${nestedError}`;
    }
  }

  return true;
}

export function validationMiddleware(config: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    let errorCode = "validation_error";

    if (config.body) {
      for (const rule of config.body) {
        const value = req.body?.[rule.field];
        const error = validateField(value, rule, "body");
        if (error) {
          errors.push(error);
          if (rule.errorCode) errorCode = rule.errorCode;
        }
      }
    }

    if (config.query) {
      for (const rule of config.query) {
        const value = req.query?.[rule.field];
        const error = validateField(value, rule, "query");
        if (error) errors.push(error);
      }
    }

    if (config.params) {
      for (const rule of config.params) {
        const value = req.params?.[rule.field];
        const error = validateField(value, rule, "params");
        if (error) errors.push(error);
      }
    }

    if (errors.length > 0) {
      helixLogger.warn("Request validation failed", {
        requestId: req.requestId,
        path: req.originalUrl,
        method: req.method,
        errors,
      });

      const errorResponse: {
        message: string;
        type: "invalid_request_error";
        code: string;
        details: string[];
        request_id?: string;
      } = {
        message: "Invalid request",
        type: "invalid_request_error",
        code: errorCode,
        details: errors,
      };

      if (req.requestId) {
        errorResponse.request_id = req.requestId;
      }

      res.status(400).json({
        error: errorResponse,
      });
      return;
    }

    next();
  };
}

export const openAIChatValidation = validationMiddleware({
  body: [
    { field: "model", required: true, type: "string", min: 1 },
    {
      field: "model",
      custom: isRegisteredModel,
      errorCode: "invalid_model",
    },
    {
      field: "messages",
      required: true,
      type: "array",
      min: 1,
      custom: validateMessages,
    },
    {
      field: "temperature",
      required: false,
      type: "number",
      min: 0,
      max: 2,
    },
    {
      field: "max_tokens",
      required: false,
      type: "number",
      min: 1,
      max: 32768,
    },
    {
      field: "top_p",
      required: false,
      type: "number",
      min: 0,
      max: 1,
    },
    { field: "stream", required: false, type: "boolean" },
    { field: "user", required: false, type: "string", max: 256 },
  ],
});