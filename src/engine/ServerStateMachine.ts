/**
 * ServerStateMachine — Models multi-mode failure dynamics (Healthy, Degraded, Flapping, Crashed, OOM)
 */

export type DetailedServerMode = 'healthy' | 'degraded' | 'flapping' | 'crashed' | 'oom_crash';

export interface ServerBehaviorProfile {
  mode: DetailedServerMode;
  latencyMultiplier: number;
  dropProbability: number;
  flappingIntervalMs: number;
  lastFlapTime: number;
  isFlapOpen: boolean; // When flapping, toggles between open (accepting) and dropped
}

export class ServerStateMachine {
  private profiles: Map<string, ServerBehaviorProfile> = new Map();

  public register(serverId: string, initialMode: DetailedServerMode = 'healthy'): void {
    this.profiles.set(serverId, {
      mode: initialMode,
      latencyMultiplier: initialMode === 'degraded' ? 4.5 : 1.0,
      dropProbability: initialMode === 'crashed' || initialMode === 'oom_crash' ? 1.0 : 0.0,
      flappingIntervalMs: 2500,
      lastFlapTime: performance.now(),
      isFlapOpen: true,
    });
  }

  public setMode(serverId: string, mode: DetailedServerMode): void {
    let profile = this.profiles.get(serverId);
    if (!profile) {
      this.register(serverId, mode);
      profile = this.profiles.get(serverId)!;
    }

    profile.mode = mode;
    switch (mode) {
      case 'degraded':
        profile.latencyMultiplier = 4.5;
        profile.dropProbability = 0.08;
        break;
      case 'flapping':
        profile.latencyMultiplier = 1.8;
        profile.dropProbability = 0.45;
        profile.lastFlapTime = performance.now();
        break;
      case 'crashed':
      case 'oom_crash':
        profile.latencyMultiplier = 1.0;
        profile.dropProbability = 1.0;
        break;
      case 'healthy':
      default:
        profile.latencyMultiplier = 1.0;
        profile.dropProbability = 0.0;
        break;
    }
  }

  public getMode(serverId: string): DetailedServerMode {
    return this.profiles.get(serverId)?.mode ?? 'healthy';
  }

  public tick(serverId: string, now: number): void {
    const profile = this.profiles.get(serverId);
    if (!profile || profile.mode !== 'flapping') return;

    // Toggle flapping state periodically
    if (now - profile.lastFlapTime >= profile.flappingIntervalMs) {
      profile.isFlapOpen = !profile.isFlapOpen;
      profile.lastFlapTime = now;
    }
  }

  public shouldAcceptPacket(serverId: string): { accepted: boolean; reason?: string } {
    const profile = this.profiles.get(serverId);
    if (!profile) return { accepted: true };

    if (profile.mode === 'crashed') {
      return { accepted: false, reason: 'SERVER_CRASHED' };
    }
    if (profile.mode === 'oom_crash') {
      return { accepted: false, reason: 'OOM_KILLED' };
    }
    if (profile.mode === 'flapping' && !profile.isFlapOpen) {
      return { accepted: false, reason: 'NETWORK_FLAP_DROP' };
    }
    if (Math.random() < profile.dropProbability) {
      return { accepted: false, reason: 'DEGRADED_DROP' };
    }

    return { accepted: true };
  }

  public getLatencyMultiplier(serverId: string): number {
    return this.profiles.get(serverId)?.latencyMultiplier ?? 1.0;
  }
}
