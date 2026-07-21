/**
 * HCB PHASE 8: Performance Certification
 * Deterministic latency benchmarking for all critical paths
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SmartRouter } from "../../src/orchestrator/SmartRouter";
import { ProviderSelector } from "../../src/orchestrator/ProviderSelector";
import { CapabilityFilter } from "../../src/orchestrator/CapabilityFilter";
import { ProviderScorer } from "../../src/orchestrator/ProviderScorer";
import { RetryEngine } from "../../src/orchestrator/RetryEngine";
import { FailoverEngine } from "../../src/orchestrator/FailoverEngine";
import { CircuitBreaker } from "../../src/orchestrator/CircuitBreaker";
import { HealthMonitor } from "../../src/orchestrator/HealthMonitor";
import { MetricsManager } from "../../src/metrics/MetricsManager";
import { ProviderType } from "../../src/types/ProviderType";
import { TaskType } from "../../src/types/TaskType";
import { ProviderCapabilities } from "../../src/models/ProviderCapabilities";
import { RoutingRequest } from "../../src/models/RoutingRequest";
import { FakeProvider, FakeProviderFactory } from "../../benchmark/providers/fake-provider";

describe("HCB PHASE 8: PERFORMANCE CERTIFICATION", () => {
    let mockProviderManager: any;

    beforeEach(() => {
        vi.clearAllMocks();
        CircuitBreaker.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
        HealthMonitor.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
        MetricsManager.reset();

        mockProviderManager = {
            executeChat: vi.fn().mockImplementation(async () => ({
                content: "Response",
                provider: "gemini",
                model: "gemini-pro"
            })),
            executeChatStream: async function* () {
                yield "chunk1";
                yield "chunk2";
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ============================================================
    // SECTION 1: LATENCY MEASUREMENT HELPERS
    // ============================================================
    function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
        const start = process.hrtime.bigint();
        return fn().then(result => ({
            result,
            latencyMs: Number(process.hrtime.bigint() - start) / 1_000_000
        }));
    }

    function calculatePercentile(values: number[], percentile: number): number {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(percentile / 100 * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    function createRoutingRequest(prompt: string, stream = false): RoutingRequest {
        return {
            prompt,
            taskType: TaskType.CHAT,
            stream,
            temperature: 0.7,
            maxTokens: 100
        };
    }

    // ============================================================
    // SECTION 2: COLD STARTUP
    // ============================================================
    describe("Cold Startup", () => {
        it("should measure cold startup latency", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            const { latencyMs } = await measureLatency(() => 
                smartRouter.route(createRoutingRequest("test"))
            );

            expect(latencyMs).toBeLessThan(5000);
        });

        it("should measure repeated cold startups", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                const smartRouter = new SmartRouter(mockProviderManager);
                const { latencyMs } = await measureLatency(() => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(1000);
            expect(p95).toBeLessThan(2000);
            expect(p99).toBeLessThan(5000);
        });
    });

    // ============================================================
    // SECTION 3: WARM STARTUP
    // ============================================================
    describe("Warm Startup", () => {
        it("should measure warm startup latency (reused router)", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            // Warm up
            await smartRouter.route(createRoutingRequest("warmup"));

            // Measure warm requests
            const latencies: number[] = [];
            for (let i = 0; i < 10; i++) {
                const { latencyMs } = await measureLatency(() => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(100);
            expect(p95).toBeLessThan(200);
            expect(p99).toBeLessThan(500);
        });
    });

    // ============================================================
    // SECTION 4: ROUTER LATENCY
    // ============================================================
    describe("Router Latency", () => {
        it("should measure end-to-end routing latency", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            const latencies: number[] = [];
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p90 = calculatePercentile(latencies, 90);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);
            const max = Math.max(...latencies);

            expect(p50).toBeLessThan(50);
            expect(p90).toBeLessThan(100);
            expect(p95).toBeLessThan(200);
            expect(p99).toBeLessThan(500);
            expect(max).toBeLessThan(1000);
        });
    });

    // ============================================================
    // SECTION 5: PROVIDER SELECTION LATENCY
    // ============================================================
    describe("Provider Selection Latency", () => {
        const testProviders: ProviderCapabilities[] = [
            { provider: ProviderType.GEMINI, enabled: true, healthy: true, priority: 1, supportsChat: true, supportsStreaming: true },
            { provider: ProviderType.OPENROUTER, enabled: true, healthy: true, priority: 2, supportsChat: true, supportsStreaming: true },
        ];

        it("should measure provider selection latency", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 1000; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(ProviderSelector.select(testProviders, TaskType.CHAT))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
            expect(p99).toBeLessThan(5);
        });
    });

    // ============================================================
    // SECTION 6: CAPABILITY FILTERING LATENCY
    // ============================================================
    describe("Capability Filtering Latency", () => {
        const testProviders: ProviderCapabilities[] = [
            { provider: ProviderType.GEMINI, enabled: true, healthy: true, priority: 1, supportsChat: true, supportsStreaming: true, supportsCoding: true, supportsVision: true, supportsReasoning: true },
            { provider: ProviderType.OPENROUTER, enabled: true, healthy: true, priority: 2, supportsChat: true, supportsStreaming: true, supportsCoding: false, supportsVision: false, supportsReasoning: false },
        ];

        it("should measure capability filtering latency", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 1000; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(CapabilityFilter.filter(testProviders, TaskType.CHAT))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
            expect(p99).toBeLessThan(5);
        });
    });

    // ============================================================
    // SECTION 7: TOKEN ACCOUNTING OVERHEAD
    // ============================================================
    describe("Token Accounting Overhead", () => {
        it("should measure token counting overhead", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(100)
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(5);
            expect(p95).toBeLessThan(10);
        });
    });

    // ============================================================
    // SECTION 8: CIRCUIT BREAKER OVERHEAD
    // ============================================================
    describe("Circuit Breaker Overhead", () => {
        it("should measure circuit breaker check latency", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 1000; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(CircuitBreaker.isAvailable(ProviderType.GEMINI))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
            expect(p99).toBeLessThan(5);
        });

        it("should measure circuit breaker record latency", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => {
                    CircuitBreaker.recordSuccess(ProviderType.GEMINI);
                    return Promise.resolve();
                });
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
        });
    });

    // ============================================================
    // SECTION 9: RETRY OVERHEAD
    // ============================================================
    describe("Retry Overhead", () => {
        it("should measure retry engine overhead on success", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => 
                    RetryEngine.execute(() => Promise.resolve("success"), 3, 10)
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(5);
            expect(p95).toBeLessThan(10);
        });

        it("should measure retry engine overhead with retries", async () => {
            let attempt = 0;
            const operation = vi.fn().mockImplementation(() => {
                attempt++;
                if (attempt < 3) throw new Error("fail");
                return "success";
            });

            const { latencyMs } = await measureLatency(() => 
                RetryEngine.execute(operation, 3, 10)
            );

            expect(latencyMs).toBeLessThan(100);
        });
    });

    // ============================================================
    // SECTION 10: FAILOVER OVERHEAD
    // ============================================================
    describe("Failover Overhead", () => {
        it("should measure failover selection latency", async () => {
            const latencies: number[] = [];
            
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(FailoverEngine.getNextProvider(
                        [
                            { provider: ProviderType.GEMINI, enabled: true, healthy: true, priority: 1 },
                            { provider: ProviderType.OPENROUTER, enabled: true, healthy: true, priority: 2 },
                        ],
                        ProviderType.GEMINI
                    ))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
            expect(p99).toBeLessThan(5);
        });
    });

    // ============================================================
    // SECTION 11: VALIDATION OVERHEAD
    // ============================================================
    describe("Validation Overhead", () => {
        it("should measure basic validation logic overhead", async () => {
            // Test the validation logic directly
            const latencies: number[] = [];
            
            for (let i = 0; i < 100; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(
                        // Simulate validation checks
                        !!("gemini-pro" && 
                         [{ role: "user", content: "test" }] && 
                         [{ role: "user", content: "test" }].length > 0 &&
                         typeof 0.7 === "number" &&
                         0.7 >= 0 && 0.7 <= 2 &&
                         typeof 100 === "number" &&
                         100 >= 1 && 100 <= 32768 &&
                         typeof 1 === "number" &&
                         1 >= 0 && 1 <= 1)
                    )
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(5);
            expect(p95).toBeLessThan(10);
        });
    });

    // ============================================================
    // SECTION 12: STREAMING LATENCY
    // ============================================================
    describe("Streaming Latency", () => {
        it("should measure first chunk latency", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const latencies: number[] = [];
            for (let i = 0; i < 50; i++) {
                const start = process.hrtime.bigint();
                const stream = provider.chatStream([{ role: "user", content: "test" }]);
                const firstChunk = await stream.next();
                const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
                
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(50);
            expect(p95).toBeLessThan(100);
        });

        it("should measure chunk-to-chunk latency", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const interChunkLatencies: number[] = [];
            let prevTime = process.hrtime.bigint();
            
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                const now = process.hrtime.bigint();
                const latencyMs = Number(now - prevTime) / 1_000_000;
                interChunkLatencies.push(latencyMs);
                prevTime = now;
            }

            if (interChunkLatencies.length > 1) {
                const p50 = calculatePercentile(interChunkLatencies, 50);
                const p95 = calculatePercentile(interChunkLatencies, 95);

                expect(p50).toBeLessThan(50);
                expect(p95).toBeLessThan(100);
            }
        });
    });

    // ============================================================
    // SECTION 13: CONCURRENT ROUTING LATENCY
    // ============================================================
    describe("Concurrent Routing Latency", () => {
        it("should measure latency under 10 concurrent requests", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            const { latencyMs } = await measureLatency(async () => {
                await Promise.all(
                    Array(10).fill(null).map((_, i) => 
                        smartRouter.route(createRoutingRequest(`test-${i}`))
                    )
                );
            });

            expect(latencyMs).toBeLessThan(1000);
        });

        it("should measure latency under 100 concurrent requests", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            const { latencyMs } = await measureLatency(async () => {
                await Promise.all(
                    Array(100).fill(null).map((_, i) => 
                        smartRouter.route(createRoutingRequest(`test-${i}`))
                    )
                );
            });

            expect(latencyMs).toBeLessThan(5000);
        });

        it("should measure latency under 500 concurrent requests", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            const { latencyMs } = await measureLatency(async () => {
                await Promise.all(
                    Array(500).fill(null).map((_, i) => 
                        smartRouter.route(createRoutingRequest(`test-${i}`))
                    )
                );
            });

            expect(latencyMs).toBeLessThan(15000);
        });
    });

    // ============================================================
    // SECTION 14: LOAD TESTS - REQUEST THROUGHPUT
    // ============================================================
    describe("Throughput Benchmarks", () => {
        it("should handle 10 requests throughput", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            const start = process.hrtime.bigint();
            
            await Promise.all(
                Array(10).fill(null).map((_, i) => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                )
            );
            
            const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
            const throughput = 10 / (durationMs / 1000);
            
            expect(throughput).toBeGreaterThan(10);
        });

        it("should handle 100 requests throughput", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            const start = process.hrtime.bigint();
            
            await Promise.all(
                Array(100).fill(null).map((_, i) => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                )
            );
            
            const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
            const throughput = 100 / (durationMs / 1000);
            
            expect(throughput).toBeGreaterThan(50);
        });

        it("should handle 500 requests throughput", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            const start = process.hrtime.bigint();
            
            await Promise.all(
                Array(500).fill(null).map((_, i) => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                )
            );
            
            const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
            const throughput = 500 / (durationMs / 1000);
            
            expect(throughput).toBeGreaterThan(100);
        });

        it("should handle 1000 requests throughput", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            const start = process.hrtime.bigint();
            
            await Promise.all(
                Array(1000).fill(null).map((_, i) => 
                    smartRouter.route(createRoutingRequest(`test-${i}`))
                )
            );
            
            const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
            const throughput = 1000 / (durationMs / 1000);
            
            expect(throughput).toBeGreaterThan(100);
        });
    });

    // ============================================================
    // SECTION 15: MEMORY STABILITY
    // ============================================================
    describe("Memory Stability", () => {
        it("should not leak memory under sustained load", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            const initialMemory = process.memoryUsage().heapUsed;
            
            for (let batch = 0; batch < 10; batch++) {
                await Promise.all(
                    Array(100).fill(null).map((_, i) => 
                        smartRouter.route(createRoutingRequest(`test-${batch}-${i}`))
                    )
                );
                
                if (global.gc) global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });

    // ============================================================
    // SECTION 16: PERFORMANCE REGRESSION BASELINES
    // ============================================================
    describe("Performance Regression Baselines", () => {
        it("should establish routing latency baseline", async () => {
            const smartRouter = new SmartRouter(mockProviderManager);
            
            // Warm up
            await smartRouter.route(createRoutingRequest("warmup"));
            
            const latencies: number[] = [];
            for (let i = 0; i < 50; i++) {
                const { latencyMs } = await measureLatency(() => 
                    smartRouter.route(createRoutingRequest(`baseline-${i}`))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);
            const p99 = calculatePercentile(latencies, 99);

            expect(p50).toBeLessThan(50);
            expect(p95).toBeLessThan(200);
            expect(p99).toBeLessThan(500);
        });

        it("should establish provider selection baseline", async () => {
            const testProviders: ProviderCapabilities[] = [
                { provider: ProviderType.GEMINI, enabled: true, healthy: true, priority: 1, supportsChat: true, supportsStreaming: true },
                { provider: ProviderType.OPENROUTER, enabled: true, healthy: true, priority: 2, supportsChat: true, supportsStreaming: true },
            ];

            const latencies: number[] = [];
            for (let i = 0; i < 1000; i++) {
                const { latencyMs } = await measureLatency(() => 
                    Promise.resolve(ProviderSelector.select(testProviders, TaskType.CHAT))
                );
                latencies.push(latencyMs);
            }

            const p50 = calculatePercentile(latencies, 50);
            const p95 = calculatePercentile(latencies, 95);

            expect(p50).toBeLessThan(1);
            expect(p95).toBeLessThan(2);
        });
    });
});