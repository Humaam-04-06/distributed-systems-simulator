/**
 * ArchitecturePresets — Pre-Configured Architectural Blueprints for System Design Scenarios
 * 
 * Provides both "Naive / Single-Node" (with realistic SPOFs) and
 * "Production High-Scale" (fault-tolerant, tiered caching, read replicas)
 * architectures for candidates to inspect, benchmark, and evaluate.
 */

import { ScenarioId, ArchitectureGrade } from './ScenarioTypes';

export interface ArchitecturePreset {
  id: string;
  scenarioId: ScenarioId;
  tier: 'naive' | 'production';
  name: string;
  description: string;
  expectedGrade: ArchitectureGrade;
  highlights: string[];
  spofsPresent: string[];
  serverCount: number;
  cacheEnabled: boolean;
  replicationEnabled: boolean;
  circuitBreakersEnabled: boolean;
  rateLimiterEnabled: boolean;
  targetRps: number;
}

export const ARCHITECTURE_PRESETS: ArchitecturePreset[] = [
  // 1. Twitter Feed
  {
    id: 'twitter-naive',
    scenarioId: 'twitter-feed',
    tier: 'naive',
    name: 'Twitter: Monolithic Fanout-on-Read',
    description: 'Single app server directly queries single relational DB with SQL JOIN on every timeline read.',
    expectedGrade: 'D',
    highlights: [
      'Simple to reason about in small demo apps',
      'Zero caching layer overhead',
    ],
    spofsPresent: [
      'Single database primary without read replicas',
      'Single application server (no load balancer)',
      'Severe fanout write amplification for high-follower accounts',
    ],
    serverCount: 1,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 300,
  },
  {
    id: 'twitter-production',
    scenarioId: 'twitter-feed',
    tier: 'production',
    name: 'Twitter: Hybrid Fanout & Redis Timeline Cluster',
    description: 'Stateless API servers behind consistent-hash LB with Redis timeline cache cluster and async fanout workers.',
    expectedGrade: 'A+',
    highlights: [
      'Hybrid push for standard users (<25k) and pull for celebrities',
      'Redis cluster caches top 800 tweets per user timeline',
      'Primary-Replica PostgreSQL with synchronous WAL streaming',
    ],
    spofsPresent: [],
    serverCount: 6,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 6000,
  },

  // 2. Uber Ride Matching
  {
    id: 'uber-naive',
    scenarioId: 'uber-ride-matching',
    tier: 'naive',
    name: 'Uber: Relational Geospatial PostGIS',
    description: 'Direct SQL ST_DWithin distance queries on monolithic Postgres instance with every 4s driver ping.',
    expectedGrade: 'D',
    highlights: [
      'Relational ACID guarantees on rider-driver table',
    ],
    spofsPresent: [
      'PostgreSQL I/O saturation on continuous driver GPS pings',
      'Global table locks during dynamic surge calculation',
      'No edge WebSocket termination layer',
    ],
    serverCount: 1,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 400,
  },
  {
    id: 'uber-production',
    scenarioId: 'uber-ride-matching',
    tier: 'production',
    name: 'Uber: H3 Hexagonal Grid & In-Memory Dispatch',
    description: 'Distributed H3 spatial index in Redis GEO with dedicated location ingestion pipeline and surge computation.',
    expectedGrade: 'A',
    highlights: [
      'Uber H3 resolution 8 cells for constant-time neighbor lookups',
      'Decoupled driver location ingestion via Netty/WebSocket gateway',
      'Surge pricing decoupled from transactional dispatch loop',
    ],
    spofsPresent: [],
    serverCount: 8,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 12000,
  },

  // 3. Black Friday Flash Sale
  {
    id: 'black-friday-naive',
    scenarioId: 'black-friday-sale',
    tier: 'naive',
    name: 'Flash Sale: Pessimistic Row Lock (SELECT FOR UPDATE)',
    description: 'All 100k shoppers hit MySQL simultaneously with SELECT FOR UPDATE on single inventory row.',
    expectedGrade: 'F',
    highlights: [
      'Strict database consistency',
    ],
    spofsPresent: [
      'Database connection pool exhaustion at 2,000 concurrent checkout requests',
      'Deadlock cascading across transactional payment threads',
      'No admission queue / virtual waiting room',
    ],
    serverCount: 2,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 250,
  },
  {
    id: 'black-friday-production',
    scenarioId: 'black-friday-sale',
    tier: 'production',
    name: 'Flash Sale: Virtual Waiting Room & Atomic Redis Lua',
    description: 'Admission-controlled virtual waiting room with atomic Redis decr Lua scripts and async payment queues.',
    expectedGrade: 'A+',
    highlights: [
      'Virtual waiting room protects downstream checkout services',
      'Atomic Redis Lua script prevents 100% of oversell bugs',
      'Redlock distributed locking with idempotent payment webhooks',
    ],
    spofsPresent: [],
    serverCount: 8,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 25000,
  },

  // 4. Netflix Streaming
  {
    id: 'netflix-naive',
    scenarioId: 'netflix-streaming',
    tier: 'naive',
    name: 'Netflix: Direct Object Storage Serving',
    description: 'All video playback streaming reads pull raw MP4 chunks directly from primary S3 bucket.',
    expectedGrade: 'D',
    highlights: [
      'Single master storage location',
    ],
    spofsPresent: [
      'S3 egress bandwidth costs exceed $1.2M/mo at scale',
      'High latency rebuffering for international viewers without edge POPs',
      'Single point of failure on origin object storage account rate limits',
    ],
    serverCount: 2,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 800,
  },
  {
    id: 'netflix-production',
    scenarioId: 'netflix-streaming',
    tier: 'production',
    name: 'Netflix: Open Connect Edge CDN & Adaptive Bitrate (ABR)',
    description: '95%+ video chunk traffic served from ISP-embedded CDN POPs with Origin Shield and ABR downshifting.',
    expectedGrade: 'A+',
    highlights: [
      'Edge CDN POPs cache 95% of chunk volume inside ISP networks',
      'Origin Shield protects transcoded master video archives',
      'ABR adjusts dynamic bitrate from 480p to 4K seamlessly',
    ],
    spofsPresent: [],
    serverCount: 10,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 45000,
  },

  // 5. URL Shortener (Bitly)
  {
    id: 'bitly-naive',
    scenarioId: 'url-shortener',
    tier: 'naive',
    name: 'Bitly: Auto-Increment SQL & Full Table Scan',
    description: 'Standard relational DB auto-increment ID with MD5 hash and unindexed redirection table.',
    expectedGrade: 'C',
    highlights: [
      'Straightforward schema setup',
    ],
    spofsPresent: [
      'Database disk I/O bottleneck on high-volume 302 redirects',
      'Auto-increment counter predictable and vulnerable to enumeration',
      'No Bloom filter to protect DB from 404 scanning attacks',
    ],
    serverCount: 1,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 600,
  },
  {
    id: 'bitly-production',
    scenarioId: 'url-shortener',
    tier: 'production',
    name: 'Bitly: Snowflake IDs, Base62 & Bloom Filter',
    description: 'Distributed 64-bit Snowflake ID generation, Base62 bijective encoding, Bloom filter and Redis LRU cache.',
    expectedGrade: 'A',
    highlights: [
      'Bloom filter intercepts 99% of invalid URL lookups without disk seek',
      'Distributed Snowflake generator prevents central coordination bottleneck',
      'Redis LRU memory cache serves 92% of active redirect traffic in <5ms',
    ],
    spofsPresent: [],
    serverCount: 6,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 18000,
  },

  // 6. WhatsApp Chat
  {
    id: 'whatsapp-naive',
    scenarioId: 'whatsapp-chat',
    tier: 'naive',
    name: 'WhatsApp: Short-Polling Relational DB',
    description: 'Mobile clients issue HTTP GET /messages?since=timestamp every 2 seconds to monolithic MySQL DB.',
    expectedGrade: 'F',
    highlights: [
      'Standard HTTP REST endpoints',
    ],
    spofsPresent: [
      'Massive server polling overhead (99% empty responses)',
      'Severe battery drain and cellular radio churn on mobile clients',
      'Database connection pool collapse under 100k active users',
    ],
    serverCount: 2,
    cacheEnabled: false,
    replicationEnabled: false,
    circuitBreakersEnabled: false,
    rateLimiterEnabled: false,
    targetRps: 500,
  },
  {
    id: 'whatsapp-production',
    scenarioId: 'whatsapp-chat',
    tier: 'production',
    name: 'WhatsApp: Persistent WebSockets & Cassandra LSM Store',
    description: 'Stateful WebSocket connection managers with dual-ACK state machines and append-only Cassandra partitions.',
    expectedGrade: 'A+',
    highlights: [
      'Bi-directional WebSocket push with epoll/kqueue session table',
      'Dual-ACK state machine (sent -> delivered -> read)',
      'Append-only Cassandra LSM-tree storage delivers sub-millisecond writes',
    ],
    spofsPresent: [],
    serverCount: 8,
    cacheEnabled: true,
    replicationEnabled: true,
    circuitBreakersEnabled: true,
    rateLimiterEnabled: true,
    targetRps: 35000,
  },
];

export class ArchitecturePresetsCatalog {
  public static getAll(): ArchitecturePreset[] {
    return ARCHITECTURE_PRESETS;
  }

  public static getByScenario(scenarioId: ScenarioId): ArchitecturePreset[] {
    return ARCHITECTURE_PRESETS.filter((p) => p.scenarioId === scenarioId);
  }

  public static getById(id: string): ArchitecturePreset | undefined {
    return ARCHITECTURE_PRESETS.find((p) => p.id === id);
  }
}
