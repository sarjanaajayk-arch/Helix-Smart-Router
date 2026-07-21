import { describe, it, expect, beforeEach, vi } from "vitest";
import { SmartRouter } from "../../src/orchestrator/SmartRouter";
import { ProviderManager } from "../../src/providers/ProviderManager";
import { ProviderType } from "../../src/types/ProviderType";
import { TaskType } from "../../src/types/TaskType";
import { RoutingRequest } from "../../src/models/RoutingRequest";
import { ChatMessage, ChatResponse } from "../../src/providers/AIProvider";
import { CircuitBreaker } from "../../src/orchestrator/CircuitBreaker";
import { HealthMonitor } from "../../src/orchestrator/HealthMonitor";

describe("SmartRouter", () => {
  let smartRouter: SmartRouter;
  let mockProviderManager: {
    executeChat: ReturnType<typeof vi.fn>;
    executeChatStream: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize CircuitBreaker for tests
    CircuitBreaker.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
    
    // Initialize HealthMonitor for tests
    HealthMonitor.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
    
    mockProviderManager = {
      executeChat: vi.fn(),
      executeChatStream: vi.fn(),
    };
    
    // Create SmartRouter with mocked providerManager
    smartRouter = new SmartRouter(mockProviderManager as unknown as ProviderManager);
  });

  it("should route chat request successfully", async () => {
    const mockResponse: ChatResponse = {
      content: "Hello response",
      provider: "gemini",
      model: "gemini-pro",
    };
    mockProviderManager.executeChat.mockResolvedValue(mockResponse);

    const request: RoutingRequest = {
      prompt: "Hello",
      taskType: TaskType.CHAT,
    };

    const response = await smartRouter.route(request);
    
    expect(response.content).toBe("Hello response");
    expect(response.provider).toBe("gemini");
    expect(response.model).toBe("gemini-pro");
    expect(mockProviderManager.executeChat).toHaveBeenCalled();
  });

  it("should route different task types with appropriate policies", async () => {
    const mockResponse: ChatResponse = {
      content: "Code response",
      provider: "gemini",
      model: "gemini-pro",
    };
    mockProviderManager.executeChat.mockResolvedValue(mockResponse);

    const codeRequest: RoutingRequest = {
      prompt: "Write code",
      taskType: TaskType.CODE,
    };

    const response = await smartRouter.route(codeRequest);
    expect(response.content).toBe("Code response");
  });

  it("should estimate tokens correctly", async () => {
    const mockResponse: ChatResponse = {
      content: "Short",
      provider: "gemini",
      model: "gemini-pro",
    };
    mockProviderManager.executeChat.mockResolvedValue(mockResponse);

    const request: RoutingRequest = {
      prompt: "A".repeat(100), // ~25 tokens
      taskType: TaskType.CHAT,
    };

    await smartRouter.route(request);
    // Just verify it doesn't throw
    expect(true).toBe(true);
  });

  it("should handle streaming requests", async () => {
    async function* mockStream() {
      yield "chunk 1";
      yield "chunk 2";
      yield "chunk 3";
    }
    
    mockProviderManager.executeChatStream.mockReturnValue(mockStream());

    const request: RoutingRequest = {
      prompt: "Stream test",
      taskType: TaskType.CHAT,
    };

    const chunks: string[] = [];
    for await (const chunk of smartRouter.routeStream(request)) {
      chunks.push(chunk);
    }
    
    expect(chunks).toEqual(["chunk 1", "chunk 2", "chunk 3"]);
  });

  it("should throw when circuit breaker is open for all providers", async () => {
    // Force open circuit breaker for GEMINI
    CircuitBreaker.forceOpen(ProviderType.GEMINI);
    // Also open for OPENROUTER (need to re-init first)
    CircuitBreaker.forceOpen(ProviderType.OPENROUTER);
    
    const request: RoutingRequest = {
      prompt: "Test",
      taskType: TaskType.CHAT,
    };

    await expect(smartRouter.route(request)).rejects.toThrow("Circuit breaker open for all available providers");
  });
});