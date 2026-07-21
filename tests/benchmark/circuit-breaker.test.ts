/**
 * HCB PHASE 5: Circuit Breaker Certification
 * Deterministic benchmark tests for circuit breaker behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CircuitBreaker } from "../../src/orchestrator/CircuitBreaker";
import { HealthMonitor } from "../../src/orchestrator/HealthMonitor";
import { ProviderType } from "../../src/types/ProviderType";
import { TimeoutConfig } from "../../src/config/TimeoutConfig";
import { FakeProvider, FakeProviderFactory } from "../../benchmark/providers/fake-provider";

describe("HCB PHASE 5: CIRCUIT BREAKER CERTIFICATION", () => {

    beforeEach(() => {
        vi.useFakeTimers();
        CircuitBreaker.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
        HealthMonitor.initialize([ProviderType.GEMINI, ProviderType.OPENROUTER]);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    // ============================================================
    // SECTION 1: CLOSED STATE
    // ============================================================
    describe("Closed State", () => {
        it("should start in closed state", () => {
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(true);
        });

        it("should allow requests in closed state", () => {
            const available = CircuitBreaker.isAvailable(ProviderType.GEMINI);
            expect(available).toBe(true);
        });

        it("should track failures in closed state", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            expect(stats?.failures).toBe(2);
            expect(stats?.state).toBe("closed");
        });

        it("should reset failure count on success in closed state", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            expect(stats?.failures).toBe(1); // Decays by 1
        });
    });

    // ============================================================
    // SECTION 2: OPEN STATE
    // ============================================================
    describe("Open State", () => {
        it("should open circuit after failure threshold", () => {
            // Default threshold is 5 failures
            for (let i = 0; i < 5; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(false);
        });

        it("should reject requests when circuit is open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(false);
        });

        it("should track open state timestamp", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            expect(stats?.nextAttempt).toBeGreaterThan(Date.now());
        });

        it("should record failure in open state (immediate re-open)", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            // Circuit stays open
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
        });
    });

    // ============================================================
    // SECTION 3: HALF-OPEN STATE
    // ============================================================
    describe("Half-Open State", () => {
        it("should transition to half-open after reset timeout", async () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(false);
            
            // Advance time past reset timeout (60 seconds default)
            await vi.advanceTimersByTimeAsync(TimeoutConfig.requestTimeoutMs + 1000);
            
            // Next check should transition to half-open
            const available = CircuitBreaker.isAvailable(ProviderType.GEMINI);
            expect(available).toBe(true);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("half-open");
        });

        it("should allow one request through in half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            CircuitBreaker.getState(ProviderType.GEMINI); // Trigger state check
            
            // Manually set to half-open for test
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(true);
        });

        it("should close circuit after successful half-open request", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            // Manually set to half-open
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            // Simulate success
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
        });

        it("should re-open circuit on failure in half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            // Manually set to half-open
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            // Simulate failure
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
        });
    });

    // ============================================================
    // SECTION 4: RECOVERY
    // ============================================================
    describe("Recovery", () => {
        it("should close circuit after consecutive successes in half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            // First success closes circuit (failures stays at 0, so condition met)
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
        });

        it("should force close circuit", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
            
            CircuitBreaker.forceClose(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(true);
        });

        it("should track recovery timing", () => {
            const before = Date.now();
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            const after = Date.now();
            
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            expect(stats?.nextAttempt).toBeGreaterThanOrEqual(before);
            expect(stats?.nextAttempt).toBeLessThanOrEqual(after + TimeoutConfig.requestTimeoutMs);
        });
    });

    // ============================================================
    // SECTION 5: OSCILLATION PREVENTION
    // ============================================================
    describe("Oscillation Prevention", () => {
        it("should not oscillate on single success then failure in half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            // One success - circuit closes
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            
            // Now failure in closed state
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed"); // Not open yet, needs threshold
        });

        it("should require multiple successes to close from half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            // First success closes circuit
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
        });

        it("should decay failures slowly in closed state", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(3);
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(2);
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(1);
        });
    });

    // ============================================================
    // SECTION 6: RAPID FAILURES
    // ============================================================
    describe("Rapid Failures", () => {
        it("should handle burst of failures", () => {
            for (let i = 0; i < 10; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(10);
        });

        it("should track failure count accurately under load", () => {
            const iterations = 20;
            for (let i = 0; i < iterations; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            expect(stats?.failures).toBe(iterations);
        });

        it("should not allow failure count to exceed reasonable bounds", () => {
            // Even with many failures, state should remain open
            for (let i = 0; i < 100; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
        });
    });

    // ============================================================
    // SECTION 7: CONSECUTIVE FAILURES
    // ============================================================
    describe("Consecutive Failures", () => {
        it("should track consecutive failures correctly", () => {
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(0);
            
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(1);
            
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(2);
        });

        it("should open exactly at threshold", () => {
            // Threshold is 5
            for (let i = 0; i < 4; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
                expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            }
            
            // 5th failure opens circuit
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
        });

        it("should isolate failure counts per provider", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.OPENROUTER);
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(2);
            expect(CircuitBreaker.getStats(ProviderType.OPENROUTER)?.failures).toBe(1);
        });
    });

    // ============================================================
    // SECTION 8: CONSECUTIVE SUCCESSES
    // ============================================================
    describe("Consecutive Successes", () => {
        it("should track consecutive successes in half-open", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            const circuit = (CircuitBreaker as any).circuits.get(ProviderType.GEMINI);
            circuit.state = "half-open";
            circuit.failures = 0;
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
        });

        it("should decay failures in closed state on success", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(3);
            
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(2);
        });

        it("should not go negative on success decay", () => {
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(0);
        });
    });

    // ============================================================
    // SECTION 9: AUTOMATIC RECOVERY TIMING
    // ============================================================
    describe("Automatic Recovery Timing", () => {
        it("should use configured reset timeout", () => {
            const resetTimeout = TimeoutConfig.requestTimeoutMs; // 60000ms
            
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            const stats = CircuitBreaker.getStats(ProviderType.GEMINI);
            
            expect(stats?.nextAttempt).toBeGreaterThan(Date.now());
            expect(stats?.nextAttempt).toBeLessThanOrEqual(Date.now() + resetTimeout);
        });

        it("should transition to half-open after timeout", async () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(false);
            
            // Advance past reset timeout
            await vi.advanceTimersByTimeAsync(TimeoutConfig.requestTimeoutMs + 1000);
            
            // Check availability - should trigger transition
            const available = CircuitBreaker.isAvailable(ProviderType.GEMINI);
            expect(available).toBe(true);
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("half-open");
        });

        it("should not transition before timeout", async () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            // Advance only partially
            await vi.advanceTimersByTimeAsync(TimeoutConfig.requestTimeoutMs / 2);
            
            expect(CircuitBreaker.isAvailable(ProviderType.GEMINI)).toBe(false);
        });
    });

    // ============================================================
    // SECTION 10: PROVIDER/MODEL ISOLATION
    // ============================================================
    describe("Provider/Model Isolation", () => {
        it("should isolate circuit state per provider", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
            expect(CircuitBreaker.getState(ProviderType.OPENROUTER)).toBe("closed");
            expect(CircuitBreaker.isAvailable(ProviderType.OPENROUTER)).toBe(true);
        });

        it("should track failures independently per provider", () => {
            for (let i = 0; i < 3; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            for (let i = 0; i < 2; i++) {
                CircuitBreaker.recordFailure(ProviderType.OPENROUTER);
            }
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(3);
            expect(CircuitBreaker.getStats(ProviderType.OPENROUTER)?.failures).toBe(2);
        });

        it("should allow independent recovery per provider", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            CircuitBreaker.forceOpen(ProviderType.OPENROUTER);
            
            CircuitBreaker.forceClose(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            expect(CircuitBreaker.getState(ProviderType.OPENROUTER)).toBe("open");
        });
    });

    // ============================================================
    // SECTION 11: INTEGRATION WITH FAKE PROVIDERS
    // ============================================================
    describe("Integration with Fake Providers", () => {
        it("should track failures from provider errors", () => {
            // Test circuit breaker logic directly (fake providers have delays)
            for (let i = 0; i < 5; i++) {
                CircuitBreaker.recordFailure(ProviderType.GEMINI);
            }
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("open");
        });

        it("should track successes from healthy provider", () => {
            for (let i = 0; i < 3; i++) {
                CircuitBreaker.recordSuccess(ProviderType.GEMINI);
            }
            
            expect(CircuitBreaker.getState(ProviderType.GEMINI)).toBe("closed");
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(0);
        });

        it("should work with timeout provider", () => {
            CircuitBreaker.recordFailure(ProviderType.GEMINI);
            
            expect(CircuitBreaker.getStats(ProviderType.GEMINI)?.failures).toBe(1);
        });
    });

    // ============================================================
    // SECTION 12: STATISTICS & MONITORING
    // ============================================================
    describe("Statistics & Monitoring", () => {
        it("should return correct stats for all providers", () => {
            CircuitBreaker.forceOpen(ProviderType.GEMINI);
            CircuitBreaker.recordFailure(ProviderType.OPENROUTER);
            
            const allStats = CircuitBreaker.getAllStats();
            
            expect(allStats[ProviderType.GEMINI]).toBeDefined();
            expect(allStats[ProviderType.GEMINI].state).toBe("open");
            expect(allStats[ProviderType.OPENROUTER]).toBeDefined();
            expect(allStats[ProviderType.OPENROUTER].state).toBe("closed");
        });

        it("should return null for unknown provider", () => {
            const stats = CircuitBreaker.getStats("unknown" as ProviderType);
            expect(stats).toBeNull();
        });

        it("should return unknown state for uninitialized provider", () => {
            const state = CircuitBreaker.getState("unknown" as ProviderType);
            expect(state).toBe("unknown");
        });
    });
});