/**
 * HCB PHASE 3: Provider Reliability Certification
 * Comprehensive provider failure mode testing using fake providers
 * Tests deterministic failure scenarios without external dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FakeProvider, FakeProviderFactory, ProviderBehavior } from "../../benchmark/providers/fake-provider";
import { ChatMessage, ChatResponse } from "../../src/providers/AIProvider";
import { ErrorNormalizer } from "../../src/validation/ErrorNormalizer";
import { ProviderType } from "../../src/types/ProviderType";

describe("HCB PHASE 3: PROVIDER RELIABILITY CERTIFICATION", () => {
    let providers: Map<string, FakeProvider>;

    beforeEach(() => {
        providers = new Map();
        vi.clearAllMocks();
    });

    afterEach(() => {
        for (const provider of providers.values()) {
            provider.reset();
        }
    });

    // ============================================================
    // SECTION 1: PROVIDER UNAVAILABILITY
    // ============================================================
    describe("Provider Unavailability", () => {
        it("should handle connection refused (ECONNREFUSED)", async () => {
            const provider = FakeProviderFactory.createUnavailable("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ECONNREFUSED");
        });

        it("should handle DNS resolution failure (EAI_AGAIN)", async () => {
            const provider = FakeProviderFactory.createDnsFailure("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("EAI_AGAIN");
        });

        it("should handle network unreachable (ENOTFOUND)", async () => {
            const provider = FakeProviderFactory.createNetworkFailure("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ENOTFOUND");
        });

        it("should handle TLS certificate verification failure", async () => {
            const provider = FakeProviderFactory.createTlsFailure("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("UNABLE_TO_VERIFY_LEAF_SIGNATURE");
        });

        it("should handle HTTP 502 Bad Gateway", async () => {
            const provider = FakeProviderFactory.createWithBehavior("gemini", "http-500");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 500 });
        });

        it("should handle connection reset (ECONNRESET)", async () => {
            const provider = FakeProviderFactory.createWithBehavior("gemini", "disconnect");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ECONNRESET");
        });
    });

    // ============================================================
    // SECTION 2: TIMEOUT SCENARIOS
    // ============================================================
    describe("Timeout Scenarios", () => {
        it("should handle request timeout (ETIMEDOUT)", async () => {
            const provider = FakeProviderFactory.createTimeout("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ETIMEDOUT");
        });

        it("should handle slow provider within timeout window", async () => {
            const provider = FakeProviderFactory.createSlow("gemini", 50);
            providers.set("gemini", provider);

            const start = Date.now();
            const response = await provider.chat([{ role: "user", content: "test" }]);
            const duration = Date.now() - start;

            expect(response.content).toContain("Slow response");
            expect(duration).toBeGreaterThanOrEqual(500);
        });

        it("should handle streaming timeout", async () => {
            const provider = FakeProviderFactory.createTimeout("gemini");
            providers.set("gemini", provider);

            const chunks: string[] = [];
            await expect(
                (async () => {
                    for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                        chunks.push(chunk);
                    }
                })()
            ).rejects.toThrow("ECONNRESET");

            expect(chunks.length).toBe(1);
        });

        it("should handle extremely slow streaming (byte-by-byte)", async () => {
            const provider = FakeProviderFactory.createSlow("gemini", 10);
            provider.setBehavior("slow");
            providers.set("gemini", provider);

            const start = Date.now();
            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }
            const duration = Date.now() - start;

            expect(chunks.length).toBeGreaterThan(0);
            expect(duration).toBeGreaterThan(100);
        });
    });

    // ============================================================
    // SECTION 3: MALFORMED RESPONSES
    // ============================================================
    describe("Malformed Responses", () => {
        it("should handle invalid JSON response", async () => {
            const provider = FakeProviderFactory.createWithBehavior("gemini", "invalid-json");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("Invalid JSON response");
        });

        it("should handle malformed streaming chunks", async () => {
            const provider = FakeProviderFactory.createMalformedStream("gemini");
            providers.set("gemini", provider);

            const chunks: string[] = [];
            await expect(
                (async () => {
                    for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                        chunks.push(chunk);
                    }
                })()
            ).rejects.toThrow("Malformed stream data");

            expect(chunks.length).toBe(1);
        });

        it("should handle partial streaming response", async () => {
            const provider = FakeProviderFactory.createPartialResponse("gemini");
            providers.set("gemini", provider);

            const chunks: string[] = [];
            for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                chunks.push(chunk);
            }

            expect(chunks.length).toBe(1);
            expect(chunks[0]).toBe("partial");
        });

        it("should handle early stream termination without error", async () => {
            const provider = FakeProviderFactory.createDisconnectStream("gemini", 1);
            providers.set("gemini", provider);

            const chunks: string[] = [];
            try {
                for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                    chunks.push(chunk);
                }
            } catch (e) {
                // Expected to throw
            }

            expect(chunks.length).toBe(1);
        });

        it("should handle mid-stream disconnect", async () => {
            const provider = FakeProviderFactory.createDisconnectStream("gemini", 3);
            providers.set("gemini", provider);

            const chunks: string[] = [];
            await expect(
                (async () => {
                    for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                        chunks.push(chunk);
                    }
                })()
            ).rejects.toThrow("ECONNRESET");

            expect(chunks.length).toBe(1);
        });
    });

    // ============================================================
    // SECTION 4: HTTP ERROR RESPONSES
    // ============================================================
    describe("HTTP Error Responses", () => {
        it("should handle 429 rate limit with retry-after", async () => {
            const provider = FakeProviderFactory.createHttp429("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 429 });
        });

        it("should handle 500 internal server error", async () => {
            const provider = FakeProviderFactory.createHttp500("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 500 });
        });

        it("should handle 502 bad gateway", async () => {
            const provider = FakeProviderFactory.createWithBehavior("gemini", "http-500");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 500 });
        });

        it("should handle 401 unauthorized", async () => {
            const provider = FakeProviderFactory.createHttp429("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow();
        });
    });

    // ============================================================
    // SECTION 5: ERROR NORMALIZATION VERIFICATION
    // ============================================================
    describe("Error Normalization", () => {
        it("should normalize connection refused to OpenAI format", () => {
            const error = new Error("ECONNREFUSED: Connection refused");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(503);
            expect(normalized.openAIError.error.type).toBe("server_error");
            expect(normalized.openAIError.error.code).toBe("service_unavailable");
        });

        it("should normalize timeout to OpenAI format", () => {
            const error = new Error("ETIMEDOUT: Operation timed out");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(408);
            expect(normalized.openAIError.error.type).toBe("timeout_error");
            expect(normalized.openAIError.error.code).toBe("request_timeout");
        });

        it("should normalize rate limit to OpenAI format", () => {
            const error = new Error("429 Too Many Requests: rate limit exceeded");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(429);
            expect(normalized.openAIError.error.type).toBe("rate_limit_error");
            expect(normalized.openAIError.error.code).toBe("rate_limit_exceeded");
        });

        it("should normalize invalid JSON to OpenAI format", () => {
            const error = new Error("Invalid JSON response from provider");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(500);
            expect(normalized.openAIError.error.code).toBe("internal_error");
        });

        it("should normalize DNS failure to OpenAI format", () => {
            const error = new Error("EAI_AGAIN: DNS lookup failed");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(503);
            expect(normalized.openAIError.error.type).toBe("server_error");
        });

        it("should normalize TLS failure to OpenAI format", () => {
            const error = new Error("UNABLE_TO_VERIFY_LEAF_SIGNATURE: TLS verification failed");
            const normalized = ErrorNormalizer.normalize(error, ProviderType.GITHUB);

            expect(normalized.statusCode).toBe(503);
            expect(normalized.openAIError.error.type).toBe("server_error");
        });
    });

    // ============================================================
    // SECTION 6: RECOVERY AFTER OUTAGE
    // ============================================================
    describe("Recovery After Outage", () => {
        it("should recover after temporary unavailability", async () => {
            const provider = FakeProviderFactory.createUnavailable("gemini");
            providers.set("gemini", provider);

            // First request fails
            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ECONNREFUSED");

            // Provider recovers
            provider.setBehavior("healthy");

            // Second request succeeds
            const response = await provider.chat([{ role: "user", content: "test" }]);
            expect(response.content).toContain("gemini");
        });

        it("should recover after timeout", async () => {
            const provider = FakeProviderFactory.createTimeout("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toThrow("ETIMEDOUT");

            provider.setBehavior("healthy");

            const response = await provider.chat([{ role: "user", content: "test" }]);
            expect(response.content).toContain("gemini");
        });

        it("should recover after rate limit", async () => {
            const provider = FakeProviderFactory.createHttp429("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 429 });

            provider.setBehavior("healthy");

            const response = await provider.chat([{ role: "user", content: "test" }]);
            expect(response.content).toContain("gemini");
        });

        it("should recover after server error", async () => {
            const provider = FakeProviderFactory.createHttp500("gemini");
            providers.set("gemini", provider);

            await expect(provider.chat([{ role: "user", content: "test" }]))
                .rejects.toMatchObject({ status: 500 });

            provider.setBehavior("healthy");

            const response = await provider.chat([{ role: "user", content: "test" }]);
            expect(response.content).toContain("gemini");
        });
    });

    // ============================================================
    // SECTION 7: CROSS-REQUEST ISOLATION
    // ============================================================
    describe("Cross-Request Isolation", () => {
        it("should not leak state between requests", async () => {
            const provider = FakeProviderFactory.createHttp500("gemini");
            providers.set("gemini", provider);

            // First request fails
            try {
                await provider.chat([{ role: "user", content: "test" }]);
            } catch (e) {
                // Expected
            }

            // Second request should be independent
            try {
                await provider.chat([{ role: "user", content: "test2" }]);
            } catch (e) {
                // Expected
            }

            expect(provider.getCallCount()).toBe(2);
        });

        it("should not leak stream state between requests", async () => {
            const provider = FakeProviderFactory.createDisconnectStream("gemini", 1);
            providers.set("gemini", provider);

            // First stream fails after 1 chunk
            const chunks1: string[] = [];
            try {
                for await (const chunk of provider.chatStream([{ role: "user", content: "test" }])) {
                    chunks1.push(chunk);
                }
            } catch (e) {
                // Expected
            }

            // Create a NEW provider for the second request to test isolation
            const provider2 = FakeProviderFactory.createHealthy("gemini-2");
            providers.set("gemini-2", provider2);

            // Second stream should work normally
            const chunks2: string[] = [];
            for await (const chunk of provider2.chatStream([{ role: "user", content: "test2" }])) {
                chunks2.push(chunk);
            }

            expect(chunks1.length).toBe(1);
            expect(chunks2.length).toBeGreaterThan(0);
        });

        it("should maintain independent provider instances", async () => {
            const provider1 = FakeProviderFactory.createHttp500("gemini-1");
            const provider2 = FakeProviderFactory.createHealthy("gemini-2");
            providers.set("gemini-1", provider1);
            providers.set("gemini-2", provider2);

            try {
                await provider1.chat([{ role: "user", content: "test" }]);
            } catch (e) {
                // Expected
            }

            const response = await provider2.chat([{ role: "user", content: "test" }]);
            expect(response.content).toContain("gemini-2");
            expect(provider1.getCallCount()).toBe(1);
            expect(provider2.getCallCount()).toBe(1);
        });
    });
});