import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  min?: number;
  max?: number;
  enum?: string[];
  custom?: (value: any) => boolean | string;
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

export function validationMiddleware(config: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    if (config.body) {
      for (const rule of config.body) {
        const value = req.body?.[rule.field];
        const error = validateField(value, rule, "body");
        if (error) errors.push(error);
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

      res.status(400).json({
        error: {
          message: "Invalid request",
          type: "invalid_request_error",
          code: "validation_error",
          details: errors,
        },
      });
      return;
    }

    next();
  };
}

export const openAIChatValidation = validationMiddleware({
  body: [
    { field: "model", required: true, type: "string", min: 1 },
    { field: "messages", required: true, type: "array", min: 1 },
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