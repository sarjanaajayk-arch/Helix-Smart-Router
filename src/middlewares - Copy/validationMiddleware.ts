import { Request, Response, NextFunction } from "express";
import { helixLogger } from "../config/logger";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  min?: number;
  max?: number;
  enum?: string[];
  custom?: (value: unknown) => boolean | string;
}

export interface ValidationConfig {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

function validateField(
  value: unknown,
  rule: ValidationRule,
  path: string
): string | null {
  if (
    rule.required &&
    (value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === ""))
  ) {
    return `${path}.${rule.field} is required`;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (rule.type) {
    const actualType = Array.isArray(value)
      ? "array"
      : value !== null
        ? typeof value
        : "null";

    if (actualType !== rule.type) {
      return `${path}.${rule.field} must be of type ${rule.type}, got ${actualType}`;
    }
  }

  if (rule.type === "string") {
    const text = value as string;

    if (rule.min !== undefined && text.trim().length < rule.min) {
      return `${path}.${rule.field} must have at least ${rule.min} characters`;
    }

    if (rule.max !== undefined && text.length > rule.max) {
      return `${path}.${rule.field} must have at most ${rule.max} characters`;
    }
  }

  if (rule.type === "array") {
    const array = value as unknown[];

    if (rule.min !== undefined && array.length < rule.min) {
      return `${path}.${rule.field} must contain at least ${rule.min} items`;
    }

    if (rule.max !== undefined && array.length > rule.max) {
      return `${path}.${rule.field} must contain at most ${rule.max} items`;
    }
  }

  if (rule.type === "number") {
    const number = value as number;

    if (rule.min !== undefined && number < rule.min) {
      return `${path}.${rule.field} must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && number > rule.max) {
      return `${path}.${rule.field} must be at most ${rule.max}`;
    }
  }

  if (rule.enum && !rule.enum.includes(value as string)) {
    return `${path}.${rule.field} must be one of: ${rule.enum.join(", ")}`;
  }

  if (rule.custom) {
    const result = rule.custom(value);

    if (result !== true) {
      return `${path}.${rule.field}: ${
        typeof result === "string" ? result : "validation failed"
      }`;
    }
  }

  return null;
}

export function validationMiddleware(config: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    if (config.body) {
      for (const rule of config.body) {
        const error = validateField(req.body?.[rule.field], rule, "body");
        if (error) {
          errors.push(error);
        }
      }
    }

    if (config.query) {
      for (const rule of config.query) {
        const error = validateField(req.query?.[rule.field], rule, "query");
        if (error) {
          errors.push(error);
        }
      }
    }

    if (config.params) {
      for (const rule of config.params) {
        const error = validateField(req.params?.[rule.field], rule, "params");
        if (error) {
          errors.push(error);
        }
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
    {
      field: "model",
      required: true,
      type: "string",
      min: 1,
    },
    {
      field: "messages",
      required: true,
      type: "array",
      min: 1,
    },
    {
      field: "temperature",
      type: "number",
      min: 0,
      max: 2,
    },
    {
      field: "max_tokens",
      type: "number",
      min: 1,
      max: 32768,
    },
    {
      field: "top_p",
      type: "number",
      min: 0,
      max: 1,
    },
    {
      field: "stream",
      type: "boolean",
    },
    {
      field: "user",
      type: "string",
      max: 256,
    },
  ],
});