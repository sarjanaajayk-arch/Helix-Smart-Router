/**
 * Fake Timer Utility for Deterministic Time Testing
 * Provides controllable time for testing retry timing, circuit breaker transitions, etc.
 */

export class FakeTimers {
    private currentTime: number = Date.now();
    private timers: Map<number, { callback: () => void; fireAt: number }> = new Map();
    private nextTimerId: number = 1;
    private destroyed: boolean = false;

    constructor(initialTime: number = Date.now()) {
        this.currentTime = initialTime;
    }

    now(): number {
        return this.currentTime;
    }

    setTime(time: number): void {
        this.currentTime = time;
        this.flushTimers();
    }

    advanceTime(ms: number): void {
        this.currentTime += ms;
        this.flushTimers();
    }

    runAllTimers(): void {
        while (this.timers.size > 0) {
            const [id, timer] = this.timers.entries().next().value;
            if (timer.fireAt <= this.currentTime) {
                this.timers.delete(id);
                timer.callback();
            } else {
                this.currentTime = timer.fireAt;
                this.timers.delete(id);
                timer.callback();
            }
        }
    }

    private flushTimers(): void {
        const readyTimers: Array<{ id: number; callback: () => void }> = [];
        
        for (const [id, timer] of this.timers.entries()) {
            if (timer.fireAt <= this.currentTime) {
                readyTimers.push({ id, callback: timer.callback });
            }
        }

        for (const { id, callback } of readyTimers) {
            this.timers.delete(id);
            callback();
        }
    }

    setTimeout(callback: () => void, delay: number): number {
        if (this.destroyed) throw new Error("Timers destroyed");
        const id = this.nextTimerId++;
        const fireAt = this.currentTime + delay;
        this.timers.set(id, { callback, fireAt });
        return id;
    }

    clearTimeout(id: number): void {
        this.timers.delete(id);
    }

    setInterval(callback: () => void, interval: number): number {
        if (this.destroyed) throw new Error("Timers destroyed");
        const id = this.nextTimerId++;
        
        const tick = () => {
            if (this.destroyed) return;
            callback();
            if (!this.destroyed) {
                this.timers.set(id, { callback: tick, fireAt: this.currentTime + interval });
            }
        };
        
        this.timers.set(id, { callback: tick, fireAt: this.currentTime + interval });
        return id;
    }

    clearInterval(id: number): void {
        this.timers.delete(id);
    }

    destroy(): void {
        this.destroyed = true;
        this.timers.clear();
    }

    getTimerCount(): number {
        return this.timers.size;
    }

    getNextTimerTime(): number | null {
        let earliest = Infinity;
        for (const timer of this.timers.values()) {
            if (timer.fireAt < earliest) {
                earliest = timer.fireAt;
            }
        }
        return earliest === Infinity ? null : earliest;
    }
}

export function installFakeTimers(initialTime?: number): FakeTimers {
    const fakeTimers = new FakeTimers(initialTime);
    
    // Store original implementations
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const originalDateNow = Date.now;

    // Replace global timers
    global.setTimeout = ((callback: () => void, delay?: number) => {
        return fakeTimers.setTimeout(callback, delay ?? 0);
    }) as any;

    global.clearTimeout = ((id: number) => {
        fakeTimers.clearTimeout(id);
    }) as any;

    global.setInterval = ((callback: () => void, delay?: number) => {
        return fakeTimers.setInterval(callback, delay ?? 0);
    }) as any;

    global.clearInterval = ((id: number) => {
        fakeTimers.clearInterval(id);
    }) as any;

    // Override Date.now
    (global.Date as any).now = () => fakeTimers.now();

    return fakeTimers;
}

export function uninstallFakeTimers(): void {
    // Note: In real usage, you'd restore original implementations
    // For test isolation, each test should get fresh timers
}