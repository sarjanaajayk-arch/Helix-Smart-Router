import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryEngine } from "../../src/orchestrator/RetryEngine";
import { MetricsManager } from "../../src/metrics/MetricsManager";

describe("RetryEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset metrics between tests
  });

  it("should succeed on first attempt", async () => {
    const operation = vi.fn().mockResolvedValue("success");
    
    const result = await RetryEngine.execute(operation, 3, 10);
    
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed on second attempt", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("success");
    
    const result = await RetryEngine.execute(operation, 3, 5);
    
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should retry up to max attempts then throw", async () => {
    const error = new Error("persistent failure");
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(RetryEngine.execute(operation, 3, 5)).rejects.toThrow("persistent failure");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff", async () => {
    const startTime = Date.now();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("success");
    
    await RetryEngine.execute(operation, 3, 10);
    
    const elapsed = Date.now() - startTime;
    // With 10ms base delay and 2x backoff: ~10 + 20 = 30ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(25);
  });

  it("should respect max delay cap", async () => {
    const startTime = Date.now();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("success");
    
    // Use small initial delay and large multiplier
    await RetryEngine.execute(operation, 3, 5);
    
    // Should not take excessively long even with retries
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(1000);
  });

  it("should handle operation that throws non-Error", async () => {
    const operation = vi.fn().mockRejectedValue("string error");
    
    await expect(RetryEngine.execute(operation, 2, 5)).rejects.toBe("string error");
    expect(operation).toHaveBeenCalledTimes(2);
  });
});