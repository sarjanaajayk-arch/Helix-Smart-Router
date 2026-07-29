import { ProviderType } from "../types/ProviderType";
import { TimeoutConfig } from "../config/TimeoutConfig";
import { helixLogger } from "../config/logger";

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    lastFailure: number;
    nextAttempt: number;
}

export class CircuitBreaker {
    private static readonly circuits = new Map<ProviderType, CircuitBreakerState>();
    
    // Configuration
    private static readonly FAILURE_THRESHOLD = 5;        // failures before opening
    private static readonly RESET_TIMEOUT = TimeoutConfig.requestTimeoutMs; // 60s before half-open
    // successes in half-open before closing
    
    static initialize(providers: ProviderType[]): void {
        providers.forEach(provider => {
            this.circuits.set(provider, {
                state: "closed",
                failures: 0,
                lastFailure: 0,
                nextAttempt: 0,
            });
        });
    }
    
    static recordSuccess(provider: ProviderType): void {
        const circuit = this.circuits.get(provider);
        if (!circuit) return;
        
        if (circuit.state === "half-open") {
            // In half-open, need consecutive successes to close
            circuit.failures = Math.max(0, circuit.failures - 1);
            if (circuit.failures === 0) {
                circuit.state = "closed";
                helixLogger.info("Circuit breaker closed", { provider });
            }
        } else if (circuit.state === "closed") {
            // In closed state, slowly decay failures
            circuit.failures = Math.max(0, circuit.failures - 1);
        }
    }
    
    static recordFailure(provider: ProviderType): void {
        const circuit = this.circuits.get(provider);
        if (!circuit) return;
        
        circuit.failures++;
        circuit.lastFailure = Date.now();
        
        if (circuit.state === "half-open") {
            // Any failure in half-open immediately opens the circuit
            circuit.state = "open";
            circuit.nextAttempt = Date.now() + this.RESET_TIMEOUT;
            helixLogger.warn("Circuit breaker opened from half-open", { provider });
        } else if (circuit.state === "closed" && circuit.failures >= this.FAILURE_THRESHOLD) {
            // Open the circuit
            circuit.state = "open";
            circuit.nextAttempt = Date.now() + this.RESET_TIMEOUT;
            helixLogger.warn("Circuit breaker opened", { 
                provider, 
                failures: circuit.failures,
                threshold: this.FAILURE_THRESHOLD 
            });
        }
    }
    
    static isAvailable(provider: ProviderType): boolean {
        const circuit = this.circuits.get(provider);
        if (!circuit) return true; // Unknown provider = allow
        
        const now = Date.now();
        
        switch (circuit.state) {
            case "closed":
                return true;
                
            case "open":
                // Check if we should transition to half-open
                if (now >= circuit.nextAttempt) {
                    circuit.state = "half-open";
                    circuit.failures = 0;
                    helixLogger.info("Circuit breaker half-open", { provider });
                    return true;
                }
                return false;
                
            case "half-open":
                // Allow one request through in half-open
                return true;
        }
    }
    
    static getState(provider: ProviderType): CircuitState | "unknown" {
        const circuit = this.circuits.get(provider);
        return circuit?.state ?? "unknown";
    }
    
    static getStats(provider: ProviderType): { state: CircuitState; failures: number; nextAttempt: number } | null {
        const circuit = this.circuits.get(provider);
        if (!circuit) return null;
        return {
            state: circuit.state,
            failures: circuit.failures,
            nextAttempt: circuit.nextAttempt,
        };
    }
    
    static getAllStats(): Record<string, { state: CircuitState; failures: number; nextAttempt: number }> {
        const result: Record<string, { state: CircuitState; failures: number; nextAttempt: number }> = {};
        this.circuits.forEach((circuit, provider) => {
            result[provider] = {
                state: circuit.state,
                failures: circuit.failures,
                nextAttempt: circuit.nextAttempt,
            };
        });
        return result;
    }
    
    static forceOpen(provider: ProviderType): void {
        const circuit = this.circuits.get(provider);
        if (circuit) {
            circuit.state = "open";
            circuit.nextAttempt = Date.now() + this.RESET_TIMEOUT;
            helixLogger.warn("Circuit breaker force opened", { provider });
        }
    }
    
    static forceClose(provider: ProviderType): void {
        const circuit = this.circuits.get(provider);
        if (circuit) {
            circuit.state = "closed";
            circuit.failures = 0;
            helixLogger.info("Circuit breaker force closed", { provider });
        }
    }
}