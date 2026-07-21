/**
 * Benchmark Harness - Core Test Infrastructure
 * Provides isolated test environments, metrics collection, and result recording
 */

import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

export interface BenchmarkResult {
    name: string;
    phase: string;
    passed: boolean;
    durationMs: number;
    metrics?: Record<string, number>;
    error?: string;
}

export interface BenchmarkContext {
    results: BenchmarkResult[];
    startTime: number;
    fakeTimers?: any;
}

export class BenchmarkHarness {
    private context: BenchmarkContext;
    private currentPhase: string = "";

    constructor() {
        this.context = {
            results: [],
            startTime: Date.now(),
        };
    }

    phase(name: string): void {
        this.currentPhase = name;
    }

    async run<T>(
        name: string, 
        fn: () => Promise<T> | T
    ): Promise<T> {
        const startTime = Date.now();
        let passed = false;
        let error: string | undefined;
        let result: T;

        try {
            result = await fn();
            passed = true;
            return result;
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
            throw e;
        } finally {
            const durationMs = Date.now() - startTime;
            this.context.results.push({
                name,
                phase: this.currentPhase,
                passed,
                durationMs,
                error,
            });
        }
    }

    recordMetric(name: string, value: number): void {
        const lastResult = this.context.results[this.context.results.length - 1];
        if (lastResult) {
            lastResult.metrics = lastResult.metrics || {};
            lastResult.metrics[name] = value;
        }
    }

    getResults(): BenchmarkResult[] {
        return [...this.context.results];
    }

    getPhaseResults(phase: string): BenchmarkResult[] {
        return this.context.results.filter(r => r.phase === phase);
    }

    getSummary(): {
        total: number;
        passed: number;
        failed: number;
        byPhase: Record<string, { total: number; passed: number; failed: number }>;
        totalDurationMs: number;
    } {
        const total = this.context.results.length;
        const passed = this.context.results.filter(r => r.passed).length;
        const failed = total - passed;
        
        const byPhase: Record<string, { total: number; passed: number; failed: number }> = {};
        for (const result of this.context.results) {
            if (!byPhase[result.phase]) {
                byPhase[result.phase] = { total: 0, passed: 0, failed: 0 };
            }
            byPhase[result.phase].total++;
            if (result.passed) {
                byPhase[result.phase].passed++;
            } else {
                byPhase[result.phase].failed++;
            }
        }

        return {
            total,
            passed,
            failed,
            byPhase,
            totalDurationMs: Date.now() - this.context.startTime,
        };
    }

    printSummary(): void {
        const summary = this.getSummary();
        console.log("\n=== HELIX CERTIFICATION BENCHMARK SUMMARY ===");
        console.log(`Total Tests: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Duration: ${summary.totalDurationMs}ms`);
        console.log("\nBy Phase:");
        for (const [phase, stats] of Object.entries(summary.byPhase)) {
            console.log(`  ${phase}: ${stats.passed}/${stats.total} passed`);
        }
        
        const failedTests = this.context.results.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log("\nFAILED TESTS:");
            for (const test of failedTests) {
                console.log(`  [${test.phase}] ${test.name}: ${test.error}`);
            }
        }
        console.log("============================================\n");
    }

    assertAllPassed(): void {
        const failed = this.context.results.filter(r => !r.passed);
        if (failed.length > 0) {
            const messages = failed.map(f => `[${f.phase}] ${f.name}: ${f.error}`).join("\n");
            throw new Error(`Benchmark failed with ${failed.length} failures:\n${messages}`);
        }
    }
}

// Global harness instance for tests
let globalHarness: BenchmarkHarness | null = null;

export function getHarness(): BenchmarkHarness {
    if (!globalHarness) {
        globalHarness = new BenchmarkHarness();
    }
    return globalHarness;
}

export function resetHarness(): void {
    globalHarness = new BenchmarkHarness();
}

/**
 * Test isolation utilities
 */
export function createIsolatedTestEnv() {
    const originalEnv = { ...process.env };
    const mocks: Map<string, any> = new Map();

    return {
        setEnv(key: string, value: string): void {
            process.env[key] = value;
        },
        restoreEnv(): void {
            process.env = originalEnv;
        },
        mockModule<T>(modulePath: string, mock: T): void {
            vi.doMock(modulePath, () => mock);
            mocks.set(modulePath, mock);
        },
        clearMocks(): void {
            vi.clearAllMocks();
            mocks.clear();
        },
    };
}

/**
 * Golden dataset comparisons
 */
export function assertGoldenOutput<T>(
    actual: T,
    expected: T,
    tolerance?: number
): void {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    
    if (actualStr !== expectedStr) {
        // For numeric comparisons with tolerance
        if (tolerance !== undefined && typeof actual === "number" && typeof expected === "number") {
            if (Math.abs(actual - expected) <= tolerance) {
                return;
            }
        }
        throw new Error(`Golden output mismatch:\nExpected:\n${expectedStr}\n\nActual:\n${actualStr}`);
    }
}

/**
 * Deterministic test data generators
 */
export const TestData = {
    generateMessages(count: number, baseContent: string = "test"): ChatMessage[] {
        const roles: Array<"system" | "user" | "assistant"> = ["system", "user", "assistant"];
        return Array.from({ length: count }, (_, i) => ({
            role: roles[i % roles.length],
            content: `${baseContent} ${i + 1}`,
        }));
    },

    generateOpenAIRequest(overrides: Partial<any> = {}): any {
        return {
            model: "gpt-4",
            messages: [
                { role: "user", content: "Hello, world!" }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: false,
            ...overrides,
        };
    },

    generateStreamingRequest(overrides: Partial<any> = {}): any {
        return {
            ...TestData.generateOpenAIRequest(),
            stream: true,
            ...overrides,
        };
    },
};

// Re-export types
import { ChatMessage } from "../../src/providers/AIProvider";
export type { ChatMessage };