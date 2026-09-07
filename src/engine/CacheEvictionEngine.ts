/**
 * CacheEvictionEngine — Models in-memory distributed cache with LRU, LFU, and FIFO eviction algorithms
 */

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo';

export interface CacheEntry {
  key: string;
  value: string;
  sizeBytes: number;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttlMs: number;
  isHotKey?: boolean;
}

export interface CacheMetrics {
  hitCount: number;
  missCount: number;
  hitRatioPercentage: number;
  totalEntries: number;
  maxEntries: number;
  memoryUsedBytes: number;
  maxMemoryBytes: number;
  evictionCount: number;
}

export class CacheEvictionEngine {
  private entries: Map<string, CacheEntry> = new Map();
  private policy: EvictionPolicy = 'lru';
  private maxEntries: number = 24;
  private maxMemoryBytes: number = 64 * 1024; // 64 KB
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;

  constructor(maxEntries: number = 24, initialPolicy: EvictionPolicy = 'lru') {
    this.maxEntries = maxEntries;
    this.policy = initialPolicy;
    this.seedDefaultEntries();
  }

  private seedDefaultEntries(): void {
    const now = performance.now();
    const defaults = [
      { key: 'user:session:1001', val: '{"userId":"1001","tier":"gold"}', ttl: 30000, hot: true },
      { key: 'product:sku:9823', val: '{"sku":"9823","inventory":480}', ttl: 25000, hot: false },
      { key: 'pricing:rules:eu', val: '{"vat":0.20,"discount":0.05}', ttl: 60000, hot: false },
      { key: 'leaderboard:top10', val: '["alice","bob","charlie"]', ttl: 15000, hot: true },
      { key: 'api:token:oauth_99', val: '{"scope":"read,write"}', ttl: 45000, hot: false },
      { key: 'catalog:categories', val: '["tech","books","home"]', ttl: 90000, hot: false },
    ];

    for (const d of defaults) {
      this.set(d.key, d.val, d.ttl, d.hot, now);
    }
  }

  public getPolicy(): EvictionPolicy {
    return this.policy;
  }

  public setPolicy(policy: EvictionPolicy): void {
    this.policy = policy;
  }

  public get(key: string, now: number = performance.now()): { hit: boolean; value?: string; isExpired?: boolean } {
    const entry = this.entries.get(key);
    if (!entry) {
      this.missCount++;
      return { hit: false };
    }

    // Check TTL expiration
    const age = now - entry.createdAt;
    if (entry.ttlMs > 0 && age > entry.ttlMs) {
      this.entries.delete(key);
      this.missCount++;
      return { hit: false, isExpired: true };
    }

    // Cache hit
    this.hitCount++;
    entry.lastAccessedAt = now;
    entry.accessCount++;

    return { hit: true, value: entry.value };
  }

  public set(
    key: string,
    value: string,
    ttlMs: number = 30000,
    isHotKey: boolean = false,
    now: number = performance.now()
  ): { evictedKeys: string[] } {
    const evictedKeys: string[] = [];
    const sizeBytes = key.length * 2 + value.length * 2 + 64;

    // If key already exists, overwrite
    if (this.entries.has(key)) {
      const existing = this.entries.get(key)!;
      existing.value = value;
      existing.ttlMs = ttlMs;
      existing.lastAccessedAt = now;
      existing.sizeBytes = sizeBytes;
      existing.isHotKey = isHotKey;
      return { evictedKeys };
    }

    // Evict if at maximum capacity
    while (this.entries.size >= this.maxEntries) {
      const evictedKey = this.evictOne();
      if (evictedKey) {
        evictedKeys.push(evictedKey);
        this.evictionCount++;
      } else {
        break;
      }
    }

    this.entries.set(key, {
      key,
      value,
      sizeBytes,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      ttlMs,
      isHotKey,
    });

    return { evictedKeys };
  }

  public invalidate(key: string): boolean {
    return this.entries.delete(key);
  }

  public evictOne(): string | null {
    if (this.entries.size === 0) return null;

    let candidateKey: string | null = null;
    const allEntries = Array.from(this.entries.values());

    if (this.policy === 'lru') {
      // Evict least recently used (lowest lastAccessedAt)
      allEntries.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
      candidateKey = allEntries[0].key;
    } else if (this.policy === 'lfu') {
      // Evict least frequently used (lowest accessCount)
      allEntries.sort((a, b) => a.accessCount - b.accessCount);
      candidateKey = allEntries[0].key;
    } else {
      // FIFO: Evict oldest created (lowest createdAt)
      allEntries.sort((a, b) => a.createdAt - b.createdAt);
      candidateKey = allEntries[0].key;
    }

    if (candidateKey) {
      this.entries.delete(candidateKey);
      return candidateKey;
    }

    return null;
  }

  public tick(now: number): string[] {
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.entries.entries()) {
      if (entry.ttlMs > 0 && now - entry.createdAt > entry.ttlMs) {
        expiredKeys.push(key);
      }
    }
    for (const key of expiredKeys) {
      this.entries.delete(key);
    }
    return expiredKeys;
  }

  public getMetrics(): CacheMetrics {
    const totalRequests = this.hitCount + this.missCount;
    const hitRatioPercentage =
      totalRequests > 0 ? Number(((this.hitCount / totalRequests) * 100).toFixed(1)) : 88.5;

    let memoryUsedBytes = 0;
    for (const entry of this.entries.values()) {
      memoryUsedBytes += entry.sizeBytes;
    }

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatioPercentage,
      totalEntries: this.entries.size,
      maxEntries: this.maxEntries,
      memoryUsedBytes,
      maxMemoryBytes: this.maxMemoryBytes,
      evictionCount: this.evictionCount,
    };
  }

  public getEntries(): CacheEntry[] {
    return Array.from(this.entries.values());
  }

  public clear(): void {
    this.entries.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }
}
