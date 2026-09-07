/**
 * SimulationClock — Deterministic high-precision discrete time clock
 */

export type TickCallback = (tickCount: number, deltaTimeMs: number) => void;

export class SimulationClock {
  private tickIntervalMs: number;
  private speedMultiplier: number = 1;
  private isRunning: boolean = false;
  private tickCount: number = 0;
  private timerId: number | null = null;
  private lastTime: number = 0;
  private listeners: Set<TickCallback> = new Set();

  constructor(tickIntervalMs: number = 50) {
    this.tickIntervalMs = tickIntervalMs;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.scheduleNextTick();
  }

  public pause(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  public step(): void {
    this.tick(this.tickIntervalMs);
  }

  public reset(): void {
    this.pause();
    this.tickCount = 0;
    this.lastTime = performance.now();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, Math.min(10, multiplier));
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getTickCount(): number {
    return this.tickCount;
  }

  public onTick(cb: TickCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private scheduleNextTick(): void {
    if (!this.isRunning) return;

    const delay = Math.max(5, this.tickIntervalMs / this.speedMultiplier);
    this.timerId = window.setTimeout(() => {
      const now = performance.now();
      const actualDelta = (now - this.lastTime) * this.speedMultiplier;
      this.lastTime = now;

      this.tick(actualDelta);
      this.scheduleNextTick();
    }, delay);
  }

  private tick(deltaMs: number): void {
    this.tickCount++;
    for (const listener of this.listeners) {
      try {
        listener(this.tickCount, deltaMs);
      } catch (err) {
        console.error('Error in simulation tick listener:', err);
      }
    }
  }
}
