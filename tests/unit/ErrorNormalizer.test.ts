import { describe, it, expect } from "vitest";
import { ErrorNormalizer } from "../../src/validation/ErrorNormalizer";
import { ProviderType } from "../../src/types/ProviderType";

describe("ErrorNormalizer", () => {
  it("should normalize Gemini API key error", () => {
    const error = new Error("API_KEY_INVALID: API key not valid");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(401);
    expect(normalized.openAIError.error.type).toBe("authentication_error");
    expect(normalized.openAIError.error.code).toBe("invalid_api_key");
    expect(normalized.openAIError.error.message).toBe("Invalid API key provided");
    expect(normalized.provider).toBe(ProviderType.GEMINI);
  });

  it("should normalize Gemini permission error", () => {
    const error = new Error("PERMISSION_DENIED: 403");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(403);
    expect(normalized.openAIError.error.type).toBe("permission_error");
    expect(normalized.openAIError.error.code).toBe("access_denied");
  });

  it("should normalize Gemini quota exceeded error", () => {
    const error = new Error("QUOTA_EXCEEDED: rate limit exceeded");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(429);
    expect(normalized.openAIError.error.type).toBe("rate_limit_error");
    expect(normalized.openAIError.error.code).toBe("rate_limit_exceeded");
  });

  it("should normalize Gemini invalid argument error", () => {
    const error = new Error("INVALID_ARGUMENT: 400 bad request");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(400);
    expect(normalized.openAIError.error.type).toBe("invalid_request_error");
    expect(normalized.openAIError.error.code).toBe("invalid_request");
  });

  it("should normalize Gemini not found error", () => {
    const error = new Error("NOT_FOUND: 404 model not found");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(404);
    expect(normalized.openAIError.error.type).toBe("not_found_error");
    expect(normalized.openAIError.error.code).toBe("model_not_found");
  });

  it("should normalize Gemini timeout error", () => {
    const error = new Error("DEADLINE_EXCEEDED: timeout");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(408);
    expect(normalized.openAIError.error.type).toBe("timeout_error");
    expect(normalized.openAIError.error.code).toBe("request_timeout");
  });

  it("should normalize Gemini unavailable error", () => {
    const error = new Error("UNAVAILABLE: 503 service overloaded");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    
    expect(normalized.statusCode).toBe(503);
    expect(normalized.openAIError.error.type).toBe("server_error");
    expect(normalized.openAIError.error.code).toBe("service_unavailable");
  });

  it("should normalize OpenRouter authentication error", () => {
    const error = new Error("401 Unauthorized: invalid api key");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.OPENROUTER);
    
    expect(normalized.statusCode).toBe(401);
    expect(normalized.openAIError.error.type).toBe("authentication_error");
    expect(normalized.openAIError.error.code).toBe("invalid_api_key");
  });

  it("should normalize OpenRouter rate limit error", () => {
    const error = new Error("429 Too Many Requests: rate limit");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.OPENROUTER);
    
    expect(normalized.statusCode).toBe(429);
    expect(normalized.openAIError.error.type).toBe("rate_limit_error");
    expect(normalized.openAIError.error.code).toBe("rate_limit_exceeded");
  });

  it("should normalize OpenRouter not found error", () => {
    const error = new Error("404 Not Found: model not found");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.OPENROUTER);
    
    expect(normalized.statusCode).toBe(404);
    expect(normalized.openAIError.error.type).toBe("not_found_error");
    expect(normalized.openAIError.error.code).toBe("model_not_found");
  });

  it("should normalize OpenRouter server error", () => {
    const error = new Error("500 Internal Server Error");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.OPENROUTER);
    
    expect(normalized.statusCode).toBe(503);
    expect(normalized.openAIError.error.type).toBe("server_error");
    expect(normalized.openAIError.error.code).toBe("service_unavailable");
  });

  it("should normalize generic network error", () => {
    const error = new Error("ECONNREFUSED: connection refused");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);
    
    expect(normalized.statusCode).toBe(503);
    expect(normalized.openAIError.error.type).toBe("server_error");
    expect(normalized.openAIError.error.code).toBe("service_unavailable");
  });

  it("should normalize generic timeout error", () => {
    const error = new Error("operation timeout: request timed out");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GROQ);
    
    expect(normalized.statusCode).toBe(408);
    expect(normalized.openAIError.error.type).toBe("timeout_error");
    expect(normalized.openAIError.error.code).toBe("request_timeout");
  });

  it("should normalize generic validation error", () => {
    const error = new Error("Validation failed: invalid input");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);
    
    expect(normalized.statusCode).toBe(400);
    expect(normalized.openAIError.error.type).toBe("invalid_request_error");
    expect(normalized.openAIError.error.code).toBe("invalid_request");
  });

  it("should normalize non-Error input", () => {
    const error = new Error("string error");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);
    
    expect(normalized.statusCode).toBe(500);
    expect(normalized.openAIError.error.message).toContain("Internal error");
  });

  it("should create error response", () => {
    const error = new Error("API_KEY_INVALID");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    const response = ErrorNormalizer.createErrorResponse(normalized);
    
    expect(response.error.message).toBe("Invalid API key provided");
    expect(response.error.type).toBe("authentication_error");
    expect(response.error.code).toBe("invalid_api_key");
  });

  it("should create error response with request ID", () => {
    const error = new Error("API_KEY_INVALID");
    const normalized = ErrorNormalizer.normalize(error, ProviderType.GEMINI);
    const response = ErrorNormalizer.createErrorResponseWithRequestId(normalized, "req-123");
    
    expect(response.request_id).toBe("req-123");
  });
});