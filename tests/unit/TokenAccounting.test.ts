import { describe, it, expect, beforeEach } from "vitest";
import { TokenAccounting } from "../../src/orchestrator/TokenAccounting";
import { ProviderType } from "../../src/types/ProviderType";

describe("TokenAccounting", () => {
  beforeEach(() => {
    TokenAccounting.reset();
  });

  it("should initialize with zero usage for all providers", () => {
    const usage = TokenAccounting.getAllUsage();
    for (const provider of Object.values(ProviderType)) {
      expect(usage[provider].promptTokens).toBe(0);
      expect(usage[provider].completionTokens).toBe(0);
      expect(usage[provider].totalTokens).toBe(0);
    }
  });

  it("should record usage for a provider", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 100, 50);
    
    const usage = TokenAccounting.getUsage(ProviderType.GEMINI);
    expect(usage.promptTokens).toBe(100);
    expect(usage.completionTokens).toBe(50);
    expect(usage.totalTokens).toBe(150);
  });

  it("should calculate costs correctly", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 1_000_000, 500_000);
    
    const costs = TokenAccounting.getCosts(ProviderType.GEMINI);
    // 1M input tokens * $0.075/M = $0.075
    // 500K output tokens * $0.30/M = $0.15
    expect(costs.promptCost).toBeCloseTo(0.075, 3);
    expect(costs.completionCost).toBeCloseTo(0.15, 3);
    expect(costs.totalCost).toBeCloseTo(0.225, 3);
  });

  it("should accumulate usage across multiple calls", () => {
    TokenAccounting.recordUsage(ProviderType.OPENROUTER, 100, 50);
    TokenAccounting.recordUsage(ProviderType.OPENROUTER, 200, 100);
    
    const usage = TokenAccounting.getUsage(ProviderType.OPENROUTER);
    expect(usage.promptTokens).toBe(300);
    expect(usage.completionTokens).toBe(150);
    expect(usage.totalTokens).toBe(450);
  });

  it("should get total tokens across all providers", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 100, 50);
    TokenAccounting.recordUsage(ProviderType.OPENROUTER, 200, 100);
    
    expect(TokenAccounting.getTotalTokens()).toBe(450);
  });

  it("should get total cost across all providers", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 1_000_000, 0); // $0.075
    TokenAccounting.recordUsage(ProviderType.OPENROUTER, 0, 1_000_000); // $0.60
    
    expect(TokenAccounting.getTotalCost()).toBeCloseTo(0.675, 3);
  });

  it("should estimate tokens from text", () => {
    const text = "Hello world"; // 11 chars ~ 3 tokens
    const estimated = TokenAccounting.estimateTokens(text);
    expect(estimated).toBe(3); // ceil(11/4) = 3
  });

  it("should calculate cost for specific token counts", () => {
    const cost = TokenAccounting.calculateCost(ProviderType.GROQ, 1_000_000, 1_000_000);
    // $0.05 + $0.05 = $0.10 per million
    expect(cost.promptCost).toBe(0.05);
    expect(cost.completionCost).toBe(0.05);
    expect(cost.totalCost).toBe(0.10);
  });

  it("should get pricing for a provider", () => {
    const pricing = TokenAccounting.getPricing(ProviderType.GITHUB);
    expect(pricing.inputCostPerMillion).toBe(0.10);
    expect(pricing.outputCostPerMillion).toBe(0.40);
  });

  it("should reset all usage and costs", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 100, 50);
    TokenAccounting.reset();
    
    const usage = TokenAccounting.getAllUsage();
    for (const provider of Object.values(ProviderType)) {
      expect(usage[provider].totalTokens).toBe(0);
    }
    expect(TokenAccounting.getTotalCost()).toBe(0);
  });

  it("should provide summary with by-provider breakdown", () => {
    TokenAccounting.recordUsage(ProviderType.GEMINI, 100, 50);
    TokenAccounting.recordUsage(ProviderType.OPENROUTER, 200, 100);
    
    const summary = TokenAccounting.getSummary();
    expect(summary.totalTokens).toBe(450);
    expect(summary.byProvider[ProviderType.GEMINI].usage.totalTokens).toBe(150);
    expect(summary.byProvider[ProviderType.OPENROUTER].usage.totalTokens).toBe(300);
  });
});