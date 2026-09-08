/**
 * InterviewHintsEngine — Progressive System Design Interview Guidance & Scoring Penalties
 * 
 * Provides 3 tiers of progressive hints for each scenario:
 * 1. Gentle Nudge (2pt penalty)
 * 2. Architectural Recommendation (5pt penalty)
 * 3. Canonical Blueprint Specification (10pt penalty)
 */

import { ScenarioId } from './ScenarioTypes';

export type HintLevel = 1 | 2 | 3;

export interface InterviewHint {
  id: string;
  scenarioId: ScenarioId;
  level: HintLevel;
  title: string;
  hintText: string;
  tradeOffInsight: string;
  scorePenalty: number;
}

export const SCENARIO_HINTS: InterviewHint[] = [
  // 1. Twitter Feed
  {
    id: 'tw-hint-1',
    scenarioId: 'twitter-feed',
    level: 1,
    title: 'Think About The Celebrity Problem',
    hintText: 'If Lady Gaga or Elon Musk has 100M followers, what happens to your fanout queue when they post a tweet?',
    tradeOffInsight: 'Push fanout to 100M Redis lists creates massive write amplification and queue delays.',
    scorePenalty: 2,
  },
  {
    id: 'tw-hint-2',
    scenarioId: 'twitter-feed',
    level: 2,
    title: 'Adopt Hybrid Fanout Architecture',
    hintText: 'Decouple normal users from celebrities: use fanout-on-write (push) for accounts with <25k followers, and fanout-on-read (pull) for celebrities.',
    tradeOffInsight: 'Balances read latency (sub-20ms for 95% of users) while protecting the write ingestion pipeline.',
    scorePenalty: 5,
  },
  {
    id: 'tw-hint-3',
    scenarioId: 'twitter-feed',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Use Redis Cluster with max 800 tweet IDs per user timeline list. When user opens home feed, fetch their Redis list and merge-sort celebrity tweets pulled on-the-fly.',
    tradeOffInsight: 'Achieves 99.99% read availability and keeps memory usage under 24GB per Redis node.',
    scorePenalty: 10,
  },

  // 2. Uber Ride Matching
  {
    id: 'ub-hint-1',
    scenarioId: 'uber-ride-matching',
    level: 1,
    title: 'Relational Spatial Queries Won’t Scale',
    hintText: 'Querying PostgreSQL with ST_DWithin on millions of live driver GPS updates every 4 seconds will saturate disk I/O. How can we index 2D coordinates in memory?',
    tradeOffInsight: '2D coordinates do not map directly to 1D B-Tree database indexes without spatial curves.',
    scorePenalty: 2,
  },
  {
    id: 'ub-hint-2',
    scenarioId: 'uber-ride-matching',
    level: 2,
    title: 'Partition with H3 Hexagonal Grid',
    hintText: 'Use Uber H3 or Google S2 geometry. Divide the map into hexagonal cells (Resolution 8: ~460m). Ingest driver pings into Redis GEO or in-memory ring buffers.',
    tradeOffInsight: 'Hexagons have identical distances to all 6 adjacent neighbors, eliminating the corner distortion of square geohashes.',
    scorePenalty: 5,
  },
  {
    id: 'ub-hint-3',
    scenarioId: 'uber-ride-matching',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Decouple Location Ingestion (Netty WebSockets -> Kafka -> Redis GEO) from the Dispatch Matcher. Dispatcher queries k-ring(1) neighbors and runs Dijkstra for top 5 candidates.',
    tradeOffInsight: 'Keeps dispatch P99 latency <50ms and isolates high-frequency driver telemetry from transactional booking state.',
    scorePenalty: 10,
  },

  // 3. Black Friday Flash Sale
  {
    id: 'bf-hint-1',
    scenarioId: 'black-friday-sale',
    level: 1,
    title: 'Avoid Pessimistic Locking on MySQL',
    hintText: 'If 50,000 users click "Buy Now" in the same second, SELECT FOR UPDATE on the inventory table will exhaust the database connection pool.',
    tradeOffInsight: 'Row-level locking serializes throughput and leads to transaction timeouts and deadlocks.',
    scorePenalty: 2,
  },
  {
    id: 'bf-hint-2',
    scenarioId: 'black-friday-sale',
    level: 2,
    title: 'Atomic In-Memory Lua Decrement',
    hintText: 'Cache inventory stock in Redis. Use an atomic Lua script to check and decrement stock in a single single-threaded operation.',
    tradeOffInsight: 'Guarantees 100% oversell protection at 100,000 QPS with sub-5ms latency.',
    scorePenalty: 5,
  },
  {
    id: 'bf-hint-3',
    scenarioId: 'black-friday-sale',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Place a Virtual Waiting Room (Cloudflare / Kafka) in front of API. Only let 5,000 users into checkout. Use Redis Lua for stock decrement, and emit async order tokens to Kafka for payment processing.',
    tradeOffInsight: 'Downstream payment processors and shipping services only receive traffic for valid orders, preventing cascading failure.',
    scorePenalty: 10,
  },

  // 4. Netflix Streaming
  {
    id: 'nf-hint-1',
    scenarioId: 'netflix-streaming',
    level: 1,
    title: 'Never Stream Directly from Object Storage',
    hintText: 'Streaming 4K video files directly from AWS S3 or Google Cloud Storage will result in astronomical egress bandwidth costs and high buffering latency.',
    tradeOffInsight: 'Cloud object storage egress costs ~$0.08/GB, which is financially unsustainable for petabyte-scale video.',
    scorePenalty: 2,
  },
  {
    id: 'nf-hint-2',
    scenarioId: 'netflix-streaming',
    level: 2,
    title: 'Deploy ISP-Embedded Edge CDN Appliances',
    hintText: 'Use Open Connect appliances installed directly inside regional Internet Service Provider (ISP) data centers. Split video files into 2-second HLS/DASH chunk segments.',
    tradeOffInsight: 'Achieves >95% cache hit rates at edge POPs and offloads origin network backbones.',
    scorePenalty: 5,
  },
  {
    id: 'nf-hint-3',
    scenarioId: 'netflix-streaming',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Transcode master videos into multiple bitrates (480p to 4K). Client video players run Adaptive Bitrate (ABR) algorithms to fetch segments matching current local bandwidth. Edge CDN POPs handle 98% of chunk reads.',
    tradeOffInsight: 'Completely eliminates buffering interruptions while cutting global egress bandwidth costs by 90%.',
    scorePenalty: 10,
  },

  // 5. URL Shortener (Bitly)
  {
    id: 'url-hint-1',
    scenarioId: 'url-shortener',
    level: 1,
    title: 'Auto-Increment IDs Are Vulnerable',
    hintText: 'Auto-incrementing integer IDs are easy to guess and scrape. Furthermore, a single auto-increment database counter is a centralized bottleneck.',
    tradeOffInsight: 'Attackers can easily enumerate all short links, and multi-master write replication causes auto-increment collision conflicts.',
    scorePenalty: 2,
  },
  {
    id: 'url-hint-2',
    scenarioId: 'url-shortener',
    level: 2,
    title: 'Use Snowflake Generator & Base62 Encoding',
    hintText: 'Generate 64-bit unique IDs using Twitter Snowflake (timestamp + worker ID + sequence). Encode the 64-bit number into a 7-character Base62 string ([a-zA-Z0-9]).',
    tradeOffInsight: 'Base62 7-char keys provide 62^7 = 3.5 trillion unique URLs without coordination.',
    scorePenalty: 5,
  },
  {
    id: 'url-hint-3',
    scenarioId: 'url-shortener',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Place a Bloom filter in front of the database to intercept non-existent short keys in O(1) memory. Cache hot redirect URLs in Redis LRU cache. Choose HTTP 302 for real-time analytics or 301 for edge browser caching.',
    tradeOffInsight: 'Bloom filter shields database from 404 scanning attacks and Redis cache delivers 99% of redirects in <5ms.',
    scorePenalty: 10,
  },

  // 6. WhatsApp Chat
  {
    id: 'wa-hint-1',
    scenarioId: 'whatsapp-chat',
    level: 1,
    title: 'Short-Polling Drains Mobile Batteries',
    hintText: 'Having mobile apps poll GET /messages every 2 seconds creates billions of wasted HTTP requests and drains mobile phone batteries rapidly.',
    tradeOffInsight: '99% of polling requests return empty arrays and waste cellular radio state transitions.',
    scorePenalty: 2,
  },
  {
    id: 'wa-hint-2',
    scenarioId: 'whatsapp-chat',
    level: 2,
    title: 'Bi-Directional WebSockets & Dual-ACK',
    hintText: 'Maintain persistent bi-directional WebSocket connections on gateway servers. Implement a two-phase ACK protocol: Sent (server ACK) and Delivered (recipient ACK).',
    tradeOffInsight: 'Enables instant real-time message delivery with minimal socket packet overhead.',
    scorePenalty: 5,
  },
  {
    id: 'wa-hint-3',
    scenarioId: 'whatsapp-chat',
    level: 3,
    title: 'Canonical Architecture Blueprint',
    hintText: 'Store conversation messages in Cassandra or ScyllaDB with partition key (conversation_id, bucket) and clustering key (message_id DESC). Use epoll-based gateway servers holding 50k WebSockets each with Redis user session mapping.',
    tradeOffInsight: 'Cassandra LSM-trees provide sub-millisecond append writes and handle 500k messages/sec without row locks.',
    scorePenalty: 10,
  },
];

export class InterviewHintsEngine {
  private revealedHintIds: Set<string> = new Set();

  public getHintsForScenario(scenarioId: ScenarioId): InterviewHint[] {
    return SCENARIO_HINTS.filter((h) => h.scenarioId === scenarioId);
  }

  public getHintByLevel(scenarioId: ScenarioId, level: HintLevel): InterviewHint | undefined {
    return SCENARIO_HINTS.find((h) => h.scenarioId === scenarioId && h.level === level);
  }

  public revealHint(hintId: string): InterviewHint | undefined {
    const hint = SCENARIO_HINTS.find((h) => h.id === hintId);
    if (hint) {
      this.revealedHintIds.add(hintId);
    }
    return hint;
  }

  public isHintRevealed(hintId: string): boolean {
    return this.revealedHintIds.has(hintId);
  }

  public getTotalPenalty(scenarioId?: ScenarioId): number {
    let penalty = 0;
    this.revealedHintIds.forEach((id) => {
      const hint = SCENARIO_HINTS.find((h) => h.id === id);
      if (hint && (!scenarioId || hint.scenarioId === scenarioId)) {
        penalty += hint.scorePenalty;
      }
    });
    return penalty;
  }

  public reset(): void {
    this.revealedHintIds.clear();
  }
}
