import { describe, it, expect, vi } from "vitest";
import { TimeoutWrapper } from "../../src/orchestrator/TimeoutWrapper";

describe("TimeoutWrapper", () => {
  it("should resolve promise before timeout", async () => {
    const promise = Promise.resolve("success");
    const result = await TimeoutWrapper.withTimeout(promise, 1000, "TestOp");
    expect(result).toBe("success");
  });

  it("should reject when promise exceeds timeout", async () => {
    const slowPromise = new Promise<string>((resolve) => setTimeout(() => resolve("late"), 200));
    await expect(TimeoutWrapper.withTimeout(slowPromise, 50, "SlowOp")).rejects.toThrow("timed out");
  });

  it("should reject immediately if promise already rejected", async () => {
    const failedPromise = Promise.reject(new Error("original error"));
    await expect(TimeoutWrapper.withTimeout(failedPromise, 1000, "FailOp")).rejects.toThrow("original error");
  });

  it("should enforce stream timeout", async () => {
    async function* slowGenerator() {
      yield "first";
      await new Promise((resolve) => setTimeout(resolve, 200));
      yield "second";
    }

    const generator = slowGenerator();
    const results: string[] = [];

    await expect(
      (async () => {
        for await (const item of TimeoutWrapper.withStreamTimeout(generator, 50, "StreamTest")) {
          results.push(item);
        }
      })()
    ).rejects.toThrow("timed out");
    
    expect(results).toContain("first");
  });

  it("should allow stream to complete within timeout", async () => {
    async function* fastGenerator() {
      yield "a";
      yield "b";
      yield "c";
    }

    const generator = fastGenerator();
    const results: string[] = [];

    for await (const item of TimeoutWrapper.withStreamTimeout(generator, 1000, "FastStream")) {
      results.push(item);
    }
    
    expect(results).toEqual(["a", "b", "c"]);
  });

  it("should create timeout promise", async () => {
    const timeoutPromise = TimeoutWrapper.createTimeoutPromise(100, "CustomOp");
    await expect(timeoutPromise).rejects.toThrow("CustomOp timed out after 100ms");
  });

  it("should handle withTimeout with custom timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 10));
    const result = await TimeoutWrapper.withTimeout(promise, 100, "QuickOp");
    expect(result).toBe("done");
  });

  it("should handle operation name in timeout error", async () => {
    const slowPromise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 200));
    await expect(TimeoutWrapper.withTimeout(slowPromise, 50, "NamedOperation")).rejects.toThrow("NamedOperation");
  });
});