/**
 * Fake Provider Infrastructure for Deterministic Testing
 * Provides controllable provider implementations for all failure scenarios
 */

import { ChatMessage, ChatResponse, AIProvider } from "../../src/providers/AIProvider";

export type ProviderBehavior = 
    | "healthy"
    | "unavailable"
    | "timeout"
    | "slow"
    | "invalid-json"
    | "malformed-stream"
    | "disconnect"
    | "partial-response"
    | "http-429"
    | "http-500"
    | "network-failure"
    | "dns-failure"
    | "tls-failure";

export interface FakeProviderConfig {
    name: string;
    behavior: ProviderBehavior;
    model?: string;
    latencyMs?: number;
    errorMessage?: string;
    streamChunks?: string[];
    failAfterChunks?: number;
    maxRetries?: number;
    currentRetries?: number;
}

export class FakeProvider implements AIProvider {
    readonly name: string;
    readonly model: string;
    private behavior: ProviderBehavior;
    private latencyMs: number;
    private errorMessage: string;
    private streamChunks: string[];
    private failAfterChunks: number;
    private maxRetries: number;
    private currentRetries: number;
    private callCount: number = 0;
    private streamCallCount: number = 0;

    constructor(config: FakeProviderConfig) {
        this.name = config.name;
        this.behavior = config.behavior;
        this.model = config.model || "fake-model";
        this.latencyMs = config.latencyMs || 10;
        this.errorMessage = config.errorMessage || "Simulated error";
        this.streamChunks = config.streamChunks || ["chunk1", "chunk2", "chunk3"];
        this.failAfterChunks = config.failAfterChunks || -1;
        this.maxRetries = config.maxRetries || 0;
        this.currentRetries = config.currentRetries || 0;
    }

    setBehavior(behavior: ProviderBehavior): void {
        this.behavior = behavior;
    }

    setLatency(ms: number): void {
        this.latencyMs = ms;
    }

    setMaxRetries(retries: number): void {
        this.maxRetries = retries;
    }

    getCallCount(): number {
        return this.callCount;
    }

    getStreamCallCount(): number {
        return this.streamCallCount;
    }

    reset(): void {
        this.callCount = 0;
        this.streamCallCount = 0;
        this.currentRetries = 0;
    }

    async chat(messages: ChatMessage[]): Promise<ChatResponse> {
        this.callCount++;
        
        // Simulate latency
        if (this.latencyMs > 0) {
            await new Promise(resolve => setTimeout(resolve, this.latencyMs));
        }

        switch (this.behavior) {
            case "healthy":
                return {
                    content: `Response from ${this.name} (call ${this.callCount})`,
                    provider: this.name,
                    model: this.model,
                };

            case "unavailable":
                throw new Error("ECONNREFUSED: Connection refused");

            case "timeout":
                await new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("ETIMEDOUT: Operation timed out")), 10)
                );
                throw new Error("Should not reach");

            case "slow":
                await new Promise(resolve => setTimeout(resolve, this.latencyMs * 10));
                return {
                    content: `Slow response from ${this.name}`,
                    provider: this.name,
                    model: this.model,
                };

            case "invalid-json":
                throw new Error("Invalid JSON response from provider");

            case "disconnect":
                throw new Error("ECONNRESET: Connection reset by peer");

            case "partial-response":
                return {
                    content: "Partial response...",
                    provider: this.name,
                    model: this.model,
                };

            case "http-429":
                const error429 = new Error("429 Too Many Requests") as any;
                error429.status = 429;
                error429.response = { status: 429, data: { error: { message: "Rate limited" } } };
                throw error429;

            case "http-500":
                const error500 = new Error("500 Internal Server Error") as any;
                error500.status = 500;
                error500.response = { status: 500, data: { error: { message: "Server error" } } };
                throw error500;

            case "network-failure":
                throw new Error("ENOTFOUND: Network unreachable");

            case "dns-failure":
                throw new Error("EAI_AGAIN: DNS lookup failed");

            case "tls-failure":
                throw new Error("UNABLE_TO_VERIFY_LEAF_SIGNATURE: TLS verification failed");

            case "malformed-stream":
            case "slow":
            default:
                throw new Error(`Unknown behavior: ${this.behavior}`);
        }
    }

    async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
        this.streamCallCount++;
        
        switch (this.behavior) {
            case "healthy":
                for (let i = 0; i < this.streamChunks.length; i++) {
                    if (this.latencyMs > 0) {
                        await new Promise(resolve => setTimeout(resolve, this.latencyMs));
                    }
                    if (this.failAfterChunks > 0 && i >= this.failAfterChunks) {
                        throw new Error("ECONNRESET: Connection reset by peer");
                    }
                    yield this.streamChunks[i];
                }
                break;

            case "malformed-stream":
                yield "valid chunk 1";
                if (this.latencyMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
                }
                throw new Error("Malformed stream data");
            
            case "disconnect":
            case "timeout":
                yield "chunk before disconnect";
                if (this.latencyMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
                }
                throw new Error("ECONNRESET: Connection reset by peer");

            case "partial-response":
                yield "partial";
                if (this.latencyMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
                }
                // End stream early without error
                break;

            case "http-429":
                yield "chunk before rate limit";
                if (this.latencyMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
                }
                const error429 = new Error("429 Too Many Requests") as any;
                error429.status = 429;
                throw error429;

            case "slow":
                for (let i = 0; i < this.streamChunks.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, this.latencyMs * 10));
                    yield this.streamChunks[i];
                }
                break;

            case "invalid-json":
                yield "valid chunk";
                throw new Error("Invalid JSON response");

            default:
                // For any unknown behavior, yield one chunk then throw
                yield "fallback chunk";
                throw new Error(`Unknown stream behavior: ${this.behavior}`);
        }
    }

    async *generateStream(messages: ChatMessage[]): AsyncGenerator<string> {
        yield* this.chatStream(messages);
    }
}

export class FakeProviderFactory {
    static create(config: FakeProviderConfig): FakeProvider {
        return new FakeProvider(config);
    }

    static createWithBehavior(name: string, behavior: ProviderBehavior, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior, model });
    }

    static createHealthy(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "healthy", model });
    }

    static createUnavailable(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "unavailable", model });
    }

    static createTimeout(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "timeout", model });
    }

    static createSlow(name: string, latencyMs: number, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "slow", latencyMs, model });
    }

    static createHttp429(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "http-429", model });
    }

    static createHttp500(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "http-500", model });
    }

    static createNetworkFailure(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "network-failure", model });
    }

    static createDnsFailure(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "dns-failure", model });
    }

    static createTlsFailure(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "tls-failure", model });
    }

    static createMalformedStream(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "malformed-stream", model });
    }

    static createDisconnectStream(name: string, failAfterChunks: number, model?: string): FakeProvider {
        return new FakeProvider({ 
            name, 
            behavior: "disconnect", 
            model,
            failAfterChunks 
        });
    }

    static createPartialResponse(name: string, model?: string): FakeProvider {
        return new FakeProvider({ name, behavior: "partial-response", model });
    }
}

export const PROVIDER_BEHAVIORS: ProviderBehavior[] = [
    "healthy",
    "unavailable",
    "timeout",
    "slow",
    "invalid-json",
    "malformed-stream",
    "disconnect",
    "partial-response",
    "http-429",
    "http-500",
    "network-failure",
    "dns-failure",
    "tls-failure",
];