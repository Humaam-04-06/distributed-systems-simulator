/**
 * WatchdogSupervisor — Automatic self-healing daemon for crashed and OOM worker nodes
 * Handles auto-restart timers, exponential backoff, and recovery dispatch.
 */

export interface WatchdogConfig {
  enabled: boolean;
  baseRestartDelayMs: number;
  maxRestartDelayMs: number;
  backoffMultiplier: number;
}

interface ServerWatchdogState {
  config: WatchdogConfig;
  crashedAt: number | null;
  scheduledRestartAt: number | null;
  restartAttemptCount: number;
  isRestarting: boolean;
}

export class WatchdogSupervisor {
  private servers: Map<string, ServerWatchdogState> = new Map();

  public register(
    serverId: string,
    enabled: boolean = true,
    baseRestartDelayMs: number = 4000
  ): void {
    this.servers.set(serverId, {
      config: {
        enabled,
        baseRestartDelayMs,
        maxRestartDelayMs: 20000,
        backoffMultiplier: 1.5,
      },
      crashedAt: null,
      scheduledRestartAt: null,
      restartAttemptCount: 0,
      isRestarting: false,
    });
  }

  public setEnabled(serverId: string, enabled: boolean): void {
    let state = this.servers.get(serverId);
    if (!state) {
      this.register(serverId, enabled);
      return;
    }
    state.config.enabled = enabled;
    if (!enabled) {
      state.scheduledRestartAt = null;
      state.isRestarting = false;
    }
  }

  public isEnabled(serverId: string): boolean {
    return this.servers.get(serverId)?.config.enabled ?? false;
  }

  public notifyCrash(serverId: string, now: number): void {
    let state = this.servers.get(serverId);
    if (!state) {
      this.register(serverId, true);
      state = this.servers.get(serverId)!;
    }

    if (!state.config.enabled) return;

    state.crashedAt = now;
    state.restartAttemptCount += 1;
    const delay = Math.min(
      state.config.maxRestartDelayMs,
      state.config.baseRestartDelayMs * Math.pow(state.config.backoffMultiplier, state.restartAttemptCount - 1)
    );
    state.scheduledRestartAt = now + delay;
    state.isRestarting = true;
  }

  public notifyRecovery(serverId: string): void {
    const state = this.servers.get(serverId);
    if (!state) return;
    state.crashedAt = null;
    state.scheduledRestartAt = null;
    state.isRestarting = false;
  }

  public checkRestarts(now: number, onRestart?: (serverId: string) => void): string[] {
    const resurrected: string[] = [];

    for (const [serverId, state] of this.servers.entries()) {
      if (
        state.config.enabled &&
        state.isRestarting &&
        state.scheduledRestartAt !== null &&
        now >= state.scheduledRestartAt
      ) {
        state.isRestarting = false;
        state.crashedAt = null;
        state.scheduledRestartAt = null;
        resurrected.push(serverId);
        if (onRestart) {
          onRestart(serverId);
        }
      }
    }

    return resurrected;
  }

  public getRestartProgress(
    serverId: string,
    now: number
  ): { isPending: boolean; remainingMs: number; totalDelayMs: number; progressFraction: number } | null {
    const state = this.servers.get(serverId);
    if (!state || !state.isRestarting || state.crashedAt === null || state.scheduledRestartAt === null) {
      return null;
    }

    const totalDelayMs = state.scheduledRestartAt - state.crashedAt;
    const elapsed = Math.max(0, now - state.crashedAt);
    const remainingMs = Math.max(0, state.scheduledRestartAt - now);
    const progressFraction = Math.min(1.0, elapsed / Math.max(1, totalDelayMs));

    return {
      isPending: true,
      remainingMs,
      totalDelayMs,
      progressFraction,
    };
  }

  public getAttemptCount(serverId: string): number {
    return this.servers.get(serverId)?.restartAttemptCount ?? 0;
  }

  public resetAttempts(serverId: string): void {
    const state = this.servers.get(serverId);
    if (state) {
      state.restartAttemptCount = 0;
    }
  }
}
