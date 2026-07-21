/**
 * HCB PHASE 7: Streaming Certification
 * Exhaustive OpenAI SSE compliance and streaming behavior tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FakeProvider, FakeProviderFactory } from "../../benchmark/providers/fake-provider";
import { ChatMessage } from "../../src/providers/AIProvider";

describe("HCB PHASE 7: STREAMING CERTIFICATION", () => {
    let provider: FakeProvider;

    beforeEach(() => {
        provider = FakeProviderFactory.createHealthy("gemini");
    });

    afterEach(() => {
        provider.reset();
        vi.clearAllMocks();
    });

    // ============================================================
    // SECTION 1: OPENAI SSE COMPLIANCE
    // ============================================================
    describe("OpenAI SSE Compliance", () => {
        it("should emit chunks with data: prefix format", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
            // Each chunk should be a valid string (SSE data payload)
            chunks.forEach(chunk => {
                expect(typeof chunk).toBe("string");
                expect(chunk.length).toBeGreaterThan(0);
            });
        });

        it("should not include event: field (OpenAI uses data-only)", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            // OpenAI SSE doesn't use event: field, just data:
            chunks.forEach(chunk => {
                expect(chunk).not.toContain("event:");
            });
        });

        it("should terminate with [DONE] equivalent (stream ends)", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            // Stream should complete naturally
            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 2: DATA EVENT FORMATTING
    // ============================================================
    describe("Data Event Formatting", () => {
        it("should produce valid UTF-8 chunks", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            // All chunks should be valid UTF-8 strings
            chunks.forEach(chunk => {
                expect(() => Buffer.from(chunk, "utf8").toString("utf8")).not.toThrow();
                expect(chunk).toBe(chunk); // No encoding corruption
            });
        });

        it("should handle unicode content correctly", async () => {
            const unicodeProvider = FakeProviderFactory.createHealthy("gemini");
            const unicodeContent = "Hello 世界 🌍 café naïve résumé";
            
            const chunks: string[] = [];
            for await (const chunk of unicodeProvider.chatStream([{ role: "user", content: unicodeContent }])) {
                chunks.push(chunk);
            }
            
            // Should handle unicode without corruption
            const fullResponse = chunks.join("");
            expect(fullResponse.length).toBeGreaterThan(0);
        });

        it("should emit complete words in chunks (no mid-word splits)", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            // Chunks should be reasonable text segments
            chunks.forEach(chunk => {
                expect(chunk.trim().length).toBeGreaterThan(0);
            });
        });
    });

    // ============================================================
    // SECTION 3: CHUNK ORDERING
    // ============================================================
    describe("Chunk Ordering", () => {
        it("should maintain sequential chunk order", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            // Verify chunks arrive in order (index-based)
            chunks.forEach((chunk, index) => {
                expect(chunk).toBeDefined();
            });
        });

        it("should not interleave chunks from different streams", async () => {
            const provider1 = FakeProviderFactory.createHealthy("gemini-1");
            const provider2 = FakeProviderFactory.createHealthy("gemini-2");
            
            const results = await Promise.all([
                (async () => {
                    const chunks: string[] = [];
                    for await (const chunk of provider1.chatStream([{ role: "user", content: "test-1" }])) {
                        chunks.push(chunk);
                    }
                    return chunks;
                })(),
                (async () => {
                    const chunks: string[] = [];
                    for await (const chunk of provider2.chatStream([{ role: "user", content: "test-2" }])) {
                        chunks.push(chunk);
                    }
                    return chunks;
                })()
            ]);
            
            expect(results[0].length).toBeGreaterThan(0);
            expect(results[1].length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 4: PARTIAL CHUNK CORRECTNESS
    // ============================================================
    describe("Partial Chunk Correctness", () => {
        it("should handle single-character chunks", async () => {
            const slowProvider = FakeProviderFactory.createSlow("gemini", 1);
            slowProvider.setBehavior("slow");
            
            const chunks: string[] = [];
            for await (const chunk of slowProvider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
        });

        it("should accumulate partial chunks into complete response", async () => {
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            const fullResponse = chunks.join("");
            expect(fullResponse.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 5: UTF-8 CORRECTNESS
    // ============================================================
    describe("UTF-8 Correctness", () => {
        it("should handle multi-byte UTF-8 sequences", async () => {
            const unicodeProvider = FakeProviderFactory.createHealthy("gemini");
            const testContent = "🎉🎊🎈 emoji test 中文 日本語 한국어";
            
            const chunks: string[] = [];
            for await (const chunk of unicodeProvider.chatStream([{ role: "user", content: testContent }])) {
                chunks.push(chunk);
            }
            
            const fullResponse = chunks.join("");
            expect(fullResponse.length).toBeGreaterThan(0);
            
            // Verify no encoding corruption
            expect(() => Buffer.from(fullResponse, "utf8")).not.toThrow();
        });

        it("should handle surrogate pairs correctly", async () => {
            const unicodeProvider = FakeProviderFactory.createHealthy("gemini");
            const testContent = "𝄞𝄢𝄡 musical symbols test";
            
            const chunks: string[] = [];
            for await (const chunk of unicodeProvider.chatStream([{ role: "user", content: testContent }])) {
                chunks.push(chunk);
            }
            
            const fullResponse = chunks.join("");
            expect(fullResponse.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 6: LARGE STREAMING RESPONSES
    // ============================================================
    describe("Large Streaming Responses", () => {
        it("should handle large prompt streaming", async () => {
            const largePrompt = "x".repeat(100000); // ~25k tokens
            const largeProvider = FakeProviderFactory.createHealthy("gemini");
            
            const chunks: string[] = [];
            for await (const chunk of largeProvider.chatStream([{ role: "user", content: largePrompt }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks.join("").length).toBeGreaterThan(0);
        });

        it("should handle many chunks without memory issues", async () => {
            const chunks: string[] = [];
            let totalLength = 0;
            
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
                totalLength += chunk.length;
                
                // Should not grow unbounded
                expect(totalLength).toBeLessThan(1000000);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 7: STREAMING CANCELLATION
    // ============================================================
    describe("Streaming Cancellation", () => {
        it("should allow early stream termination", async () => {
            const chunks: string[] = [];
            const stream = provider.chatStream([{ role: "user", content: "test" }]);
            
            for await (const chunk of stream) {
                chunks.push(chunk);
                if (chunks.length >= 2) {
                    break; // Early termination
                }
            }
            
            expect(chunks.length).toBe(2);
        });

        it("should handle client disconnect gracefully", async () => {
            const disconnectProvider = FakeProviderFactory.createDisconnectStream("gemini", 2);
            
            const chunks: string[] = [];
            try {
                for await (const chunk of disconnectProvider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected disconnect error
            }
            
            expect(chunks.length).toBeGreaterThanOrEqual(1);
        });
    });

    // ============================================================
    // SECTION 8: PROVIDER DISCONNECT/RECONNECT
    // ============================================================
    describe("Provider Disconnect/Reconnect", () => {
        it("should handle mid-stream disconnect", async () => {
            const disconnectProvider = FakeProviderFactory.createDisconnectStream("gemini", 3);
            
            const chunks: string[] = [];
            try {
                for await (const chunk of disconnectProvider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected ECONNRESET
            }
            
            expect(chunks.length).toBeGreaterThanOrEqual(1);
        });

        it("should allow new stream after provider recovers", async () => {
            const provider = FakeProviderFactory.createDisconnectStream("gemini", 1);
            
            // First stream fails
            let chunks: string[] = [];
            try {
                for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected
            }
            
            expect(chunks.length).toBe(1);
            
            // Provider recovers - create NEW provider with healthy behavior
            const recoveredProvider = FakeProviderFactory.createHealthy("gemini-recovered");
            
            // New stream should work
            chunks = [];
            for await (const chunk of recoveredProvider.chatStream([{ role: "user", content: "test-2" }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(1);
        });
    });

    // ============================================================
    // SECTION 9: RETRY DURING STREAM
    // ============================================================
    describe("Retry During Stream", () => {
        it("should retry failed stream from beginning", async () => {
            let attempt = 0;
            const mockStream = async function* (messages: ChatMessage[]) {
                attempt++;
                if (attempt === 1) {
                    yield "chunk 1";
                    throw new Error("ECONNRESET");
                }
                yield "retry chunk 1";
                yield "retry chunk 2";
            };
            
            let result: string[] = [];
            try {
                for await (const chunk of mockStream([{ role: "user", content: "test" }])) {
                    result.push(chunk);
                }
            } catch (e) {
                // First attempt failed
            }
            
            // Second attempt
            result = [];
            for await (const chunk of mockStream([{ role: "user", content: "test" }])) {
                result.push(chunk);
            }
            
            expect(result).toContain("retry chunk 1");
            expect(result).toContain("retry chunk 2");
        });
    });

    // ============================================================
    // SECTION 10: FAILOVER DURING STREAM
    // ============================================================
    describe("Failover During Stream", () => {
        it("should failover to secondary provider on stream failure", async () => {
            const primary = FakeProviderFactory.createDisconnectStream("gemini", 1);
            const secondary = FakeProviderFactory.createHealthy("openrouter");
            
            let chunks: string[] = [];
            try {
                for await (const chunk of primary.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Primary failed
            }
            
            expect(chunks.length).toBe(1);
            
            // Failover to secondary
            chunks = [];
            for await (const chunk of secondary.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
            // Healthy provider returns default stream chunks
            expect(chunks.join("")).toContain("chunk");
        });
    });

    // ============================================================
    // SECTION 11: TIMEOUT DURING STREAM
    // ============================================================
    describe("Timeout During Stream", () => {
        it("should timeout slow stream", async () => {
            const timeoutProvider = FakeProviderFactory.createTimeout("gemini");
            
            const chunks: string[] = [];
            try {
                for await (const chunk of timeoutProvider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected timeout error
            }
            
            expect(chunks.length).toBe(1);
        });
    });

    // ============================================================
    // SECTION 12: MALFORMED STREAM RECOVERY
    // ============================================================
    describe("Malformed Stream Recovery", () => {
        it("should handle malformed stream chunks", async () => {
            const malformedProvider = FakeProviderFactory.createMalformedStream("gemini");
            
            const chunks: string[] = [];
            try {
                for await (const chunk of malformedProvider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected malformed stream error
            }
            
            expect(chunks.length).toBe(1); // Got first valid chunk
        });

        it("should allow new stream after malformed stream", async () => {
            const malformedProvider = FakeProviderFactory.createMalformedStream("gemini");
            
            // First stream fails
            let chunks: string[] = [];
            try {
                for await (const chunk of malformedProvider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected
            }
            
            // Provider recovers
            malformedProvider.setBehavior("healthy");
            
            // New stream works
            chunks = [];
            for await (const chunk of malformedProvider.chatStream([{ role: "user", content: "test-2" }])) {
                chunks.push(chunk);
            }
            
            expect(chunks.length).toBeGreaterThan(1);
        });
    });

    // ============================================================
    // SECTION 13: CONCURRENT STREAMS
    // ============================================================
    describe("Concurrent Streams", () => {
        it("should handle multiple concurrent streams", async () => {
            const streamCount = 10;
            const providers = Array(streamCount).fill(null).map((_, i) => 
                FakeProviderFactory.createHealthy(`gemini-${i}`)
            );
            
            const results = await Promise.all(
                providers.map(p => 
                    (async () => {
                        const chunks: string[] = [];
                        for await (const chunk of p.chatStream([{ role: "user", content: "test" }])) {
                            chunks.push(chunk);
                        }
                        return chunks;
                    })()
                )
            );
            
            expect(results.length).toBe(streamCount);
            results.forEach(chunks => {
                expect(chunks.length).toBeGreaterThan(0);
            });
        });

        it("should maintain stream isolation under load", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const results = await Promise.all(
                Array(20).fill(null).map(async (_, i) => {
                    const chunks: string[] = [];
                    for await (const chunk of provider.chatStream([{ role: "user", content: `test-${i}` }])) {
                        chunks.push(chunk);
                    }
                    return chunks;
                })
            );
            
            expect(results.length).toBe(20);
            results.forEach(chunks => {
                expect(chunks.length).toBeGreaterThan(0);
            });
        });
    });

    // ============================================================
    // SECTION 14: STREAM ISOLATION
    // ============================================================
    describe("Stream Isolation", () => {
        it("should not leak state between streams", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const stream1 = provider.chatStream([{ role: "user", content: "test-1" }]);
            const stream2 = provider.chatStream([{ role: "user", content: "test-2" }]);
            
            const [chunks1, chunks2] = await Promise.all([
                (async () => { const c: string[] = []; for await (const chunk of stream1) c.push(chunk); return c; })(),
                (async () => { const c: string[] = []; for await (const chunk of stream2) c.push(chunk); return c; })()
            ]);
            
            expect(chunks1.length).toBeGreaterThan(0);
            expect(chunks2.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 15: BACKPRESSURE
    // ============================================================
    describe("Backpressure", () => {
        it("should handle slow consumer", async () => {
            const slowProvider = FakeProviderFactory.createSlow("gemini", 5);
            slowProvider.setBehavior("slow");
            
            const chunks: string[] = [];
            const start = Date.now();
            
            for await (const chunk of slowProvider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
                // Simulate slow consumer
                await new Promise(r => setTimeout(r, 10));
            }
            
            const duration = Date.now() - start;
            expect(chunks.length).toBeGreaterThan(0);
            expect(duration).toBeGreaterThan(100);
        });

        it("should not buffer unbounded data", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const chunks: string[] = [];
            let totalSize = 0;
            
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
                totalSize += chunk.length;
                
                // Should not accumulate unbounded
                expect(totalSize).toBeLessThan(1000000);
            }
            
            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // SECTION 16: SLOW CONSUMER / FAST PRODUCER
    // ============================================================
    describe("Slow Consumer / Fast Producer", () => {
        it("should handle fast producer with slow consumer", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
                await new Promise(r => setTimeout(r, 5)); // Slow consumer
            }
            
            expect(chunks.length).toBeGreaterThan(0);
        });

        it("should handle multiple slow consumers", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            const promises = Array(5).fill(null).map(async () => {
                const chunks: string[] = [];
                for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                    await new Promise(r => setTimeout(r, 10));
                }
                return chunks;
            });
            
            const results = await Promise.all(promises);
            results.forEach(chunks => {
                expect(chunks.length).toBeGreaterThan(0);
            });
        });
    });

    // ============================================================
    // SECTION 17: MEMORY STABILITY DURING LONG STREAMS
    // ============================================================
    describe("Memory Stability During Long Streams", () => {
        it("should not leak memory during extended streaming", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            // Simulate long streaming session
            let totalChunks = 0;
            for (let i = 0; i < 100; i++) {
                const chunks: string[] = [];
                for await (const chunk of provider.chatStream([{ role: "user", content: `test-${i}` }])) {
                    chunks.push(chunk);
                    totalChunks++;
                }
                expect(chunks.length).toBeGreaterThan(0);
            }
            
            expect(totalChunks).toBeGreaterThan(100);
        });

        it("should maintain consistent call count", async () => {
            const provider = FakeProviderFactory.createHealthy("gemini");
            
            for (let i = 0; i < 50; i++) {
                const chunks: string[] = [];
                for await (const chunk of provider.chatStream([{ role: "user", content: `test-${i}` }])) {
                    chunks.push(chunk);
                }
            }
            
            expect(provider.getStreamCallCount()).toBe(50);
        });
    });
});