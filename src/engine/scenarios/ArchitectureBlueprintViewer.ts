import { ScenarioId } from './ScenarioTypes';

export interface ArchitectureBlueprint {
  id: string;
  scenarioId: ScenarioId;
  tier: 'naive' | 'production';
  title: string;
  asciiDiagram: string;
  dataFlowSteps: string[];
  protocols: string[];
  spofsIdentified: string[];
  resilienceMechanisms: string[];
}

export const ARCHITECTURE_BLUEPRINTS: Record<ScenarioId, Record<'naive' | 'production', ArchitectureBlueprint>> = {
  'twitter-feed': {
    naive: {
      id: 'tw-naive-blueprint',
      scenarioId: 'twitter-feed',
      tier: 'naive',
      title: 'Twitter: Monolithic Synchronous Fan-out Architecture',
      asciiDiagram: `
  [Mobile / Web Clients]
            │ HTTP (Synchronous POST /tweet)
            ▼
  ┌─────────────────────────────────────────┐
  │         Single App Server               │
  │  (Eager Fanout Loop: 10M iterations)    │
  └───────────────────┬─────────────────────┘
                      │ SQL INSERT INTO timelines
                      ▼
  ┌─────────────────────────────────────────┐
  │     Single MySQL Primary DB             │
  │  (SPOF - Disk I/O Bottleneck & Lockups) │
  └─────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. Client issues synchronous POST /tweet payload to Single App Server.',
        '2. App Server queries MySQL to fetch all follower IDs for author.',
        '3. App Server executes synchronous loop inserting timeline row for every follower.',
        '4. For high-follower accounts, loop ties up server thread for 30+ seconds until request timeout.',
      ],
      protocols: ['HTTP/1.1 REST', 'Direct MySQL TCP Connection'],
      spofsIdentified: [
        'Single App Server (No load balancing)',
        'Single MySQL instance (No read replicas or caching)',
        'Synchronous fan-out write pipeline blocking request thread',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'tw-production-blueprint',
      scenarioId: 'twitter-feed',
      tier: 'production',
      title: 'Twitter: Decoupled Hybrid Push/Pull Architecture with Redis Timelines',
      asciiDiagram: `
  [Global Clients] ──► [Edge CloudFront CDN / Anycast DNS]
                               │ HTTPS / TLS 1.3
                               ▼
                    [Edge Load Balancers (ALB)]
                               │ Round-Robin / Least Conn
                               ▼
                    [Stateless Tweet Ingestion Cluster]
                               │
            ┌──────────────────┴──────────────────┐
            │ Publish Event                       │ Async Write
            ▼                                     ▼
  [Kafka Ingestion Topic]               [Distributed Sharded DB (Cassandra)]
            │                                     │
            ▼                                     │ Read fallback
  [Timeline Fan-out Workers]                      │
    ├─ Normal (<25k): Push to Redis Cluster ──────┤
    └─ Celebrity (>25k): Skip push (Pull on Read) ┘
            │
            ▼
  [Redis Timeline In-Memory Cache (Cluster)]
      `,
      dataFlowSteps: [
        '1. Client POSTs tweet to Anycast Load Balancer -> Tweet Ingestion Service.',
        '2. Tweet persisted immediately to distributed Cassandra / CockroachDB cluster.',
        '3. Ingestion service publishes `TweetCreatedEvent` to Kafka partition topic.',
        '4. Fanout workers inspect follower count: normal users pushed to Redis cluster; celebrities marked for pull-on-read.',
        '5. Feed generation service merges Redis timeline with cached celebrity tweets in < 35ms.',
      ],
      protocols: ['HTTPS / HTTP/2', 'gRPC (Internal)', 'Kafka Binary Protocol', 'RESP (Redis Serialization Protocol)'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'Hybrid Push/Pull Fanout avoids write amplification',
        'Redis Cluster replication with Sentinel failover',
        'Kafka partition replication factor 3 for zero message loss',
        'Circuit Breakers protecting Timeline service',
      ],
    },
  },

  'uber-ride-matching': {
    naive: {
      id: 'uber-naive-blueprint',
      scenarioId: 'uber-ride-matching',
      tier: 'naive',
      title: 'Uber: Monolithic Relational Dispatch with Table Locks',
      asciiDiagram: `
  [Riders & Drivers]
          │ HTTP Pings every 4s
          ▼
  ┌────────────────────────────────────────┐
  │         Single Monolithic API          │
  └───────────────────┬────────────────────┘
                      │ SELECT ... FOR UPDATE (Table Lock)
                      ▼
  ┌────────────────────────────────────────┐
  │      Single Postgres Database          │
  │   (Locked driver table during surge)   │
  └────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. 100,000 drivers ping GPS coordinates every 4 seconds via HTTP POST.',
        '2. Server performs direct SQL UPDATE on relational driver location table.',
        '3. Rider requests ride: server executes table-wide bounding box query with exclusive lock.',
        '4. Surge traffic causes lock queue starvation and cascading connection timeouts.',
      ],
      protocols: ['HTTP/1.1 Polling', 'Postgres Wire Protocol'],
      spofsIdentified: [
        'Single API Monolith',
        'Single Relational DB with synchronous row locks',
        'Unbounded polling draining mobile battery and server capacity',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'uber-production-blueprint',
      scenarioId: 'uber-ride-matching',
      tier: 'production',
      title: 'Uber: H3 Hexagonal Spatial Partitioning & Discrete Match Windows',
      asciiDiagram: `
  [Drivers & Riders] ──► [Envoy Edge Gateways (gRPC / TLS 1.3)]
                               │ Streaming gRPC Location Pings
                               ▼
                  [Location Ingestion Gateway Cluster]
                               │
            ┌──────────────────┴──────────────────┐
            │ Write Ephemeral Hex                 │ Long-term Analytics
            ▼                                     ▼
  [In-Memory Spatial Index (H3/Redis)]     [Kafka Driver Location Topic]
            │                                     │
            ▼                                     ▼
  [Dispatch Ringpop Cluster]               [ClickHouse Historical Store]
  (Batched Hungarian Algorithm matching in 5s windows)
            │
            ▼
  [Ride State Machine Service] ──► [Distributed Cassandra Storage (Quorum)]
      `,
      dataFlowSteps: [
        '1. Driver mobile apps stream location pings via bidirectional streaming gRPC.',
        '2. Location Ingestion service indexes coordinates into Uber H3 hierarchical hexagonal cells.',
        '3. Ephemeral locations updated in-memory (Redis Geospatial / memory ring); zero synchronous DB disk writes.',
        '4. Match engine runs discrete 5-second Hungarian optimization batch matching riders to drivers.',
        '5. Dispatch state machine logs state transitions with idempotency tokens into distributed Cassandra.',
      ],
      protocols: ['gRPC over HTTP/2', 'Protobuf', 'Kafka Streaming', 'CQL (Cassandra Query Language)'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'City-level Geo-Affinity partition isolation',
        'In-memory spatial index prevents database I/O saturation',
        'Discrete 5s batch matching eliminates race condition deadlocks',
        'Distributed Cassandra multi-DC replication with quorum consistency',
      ],
    },
  },

  'black-friday-sale': {
    naive: {
      id: 'bf-naive-blueprint',
      scenarioId: 'black-friday-sale',
      tier: 'naive',
      title: 'E-Commerce: Synchronous Row-Lock Checkout Pipeline',
      asciiDiagram: `
  [Shoppers (50,000 RPS)]
            │ Synchronous POST /checkout
            ▼
  ┌────────────────────────────────────────┐
  │         Single Checkout Server         │
  └───────────────────┬────────────────────┘
                      │ BEGIN TRANSACTION; SELECT FOR UPDATE;
                      ▼
  ┌────────────────────────────────────────┐
  │       Single MySQL Inventory DB        │
  │     (Row Deadlock & Overselling)       │
  └───────────────────┬────────────────────┘
                      │ Synchronous HTTP POST
                      ▼
  ┌────────────────────────────────────────┐
  │     Third-Party Payment Gateway        │
  │      (Unprotected 30s timeouts)        │
  └────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. 50,000 users click "Buy Now" at the exact same second for 5,000 flash sale units.',
        '2. Checkout server starts relational transaction: `SELECT stock FROM items WHERE id=1 FOR UPDATE`.',
        '3. Hundreds of transactions wait on the same row lock, causing lock timeout cascades and deadlocks.',
        '4. Synchronous call to external payment gateway holds DB connection open until connection pool dies.',
      ],
      protocols: ['HTTP/1.1 REST', 'Synchronous DB Connection Pool'],
      spofsIdentified: [
        'Single Inventory Row Lock bottleneck',
        'Direct synchronous external HTTP call on request thread',
        'Zero request rate limiting or queue backpressure',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'bf-production-blueprint',
      scenarioId: 'black-friday-sale',
      tier: 'production',
      title: 'E-Commerce: Atomic Lua Token Reservation & Asynchronous Order Finalization',
      asciiDiagram: `
  [Burst Shoppers] ──► [Cloudflare Edge Virtual Waiting Room / Rate Limiter]
                               │ Filtered & Token-Verified Traffic
                               ▼
                    [Edge Load Balancer (ALB)]
                               │
                               ▼
                    [Flash Sale Order Service]
                               │
            ┌──────────────────┴──────────────────┐
            │ Atomic Lua Reservation              │ Non-blocking Fail-Fast
            ▼                                     ▼
  [Redis Clustered Token Bucket]            [Immediate 429 / "Sold Out" Screen]
  (EVAL script DECRBY with check)
            │ If reserved: Emit Event
            ▼
  [Kafka Orders Topic (Partitioned by OrderId)]
            │
            ▼
  [Order Settlement & Payment Workers]
    ├─ Payment Gateway Bulkhead (Circuit Breaker)
    └─ Postgres Multi-AZ Shards (Final Settlement & Ledger)
      `,
      dataFlowSteps: [
        '1. Virtual Waiting Room meters traffic, throttling bots and issuing signed checkout access tokens.',
        '2. Order Service executes single atomic Redis Lua script: checks available stock and decrements in 0.2ms.',
        '3. If stock is zero, returns immediate 410 "Sold Out" response without touching database or payment gateway.',
        '4. If reserved, temporary 10-minute hold is placed and order event published to Kafka queue.',
        '5. Background settlement workers process payment via isolated bulkhead thread pool with circuit breaker.',
      ],
      protocols: ['HTTPS', 'gRPC', 'Redis Lua Engine', 'Kafka Event Streaming'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'Edge Virtual Waiting Room absorbs initial 100x traffic surge',
        'Atomic Redis Lua decrement prevents race conditions and overselling',
        'Bulkhead pattern isolates external payment processor latency',
        'Idempotent payment webhook retries guarantee at-least-once delivery without duplicate charges',
      ],
    },
  },

  'netflix-streaming': {
    naive: {
      id: 'nflx-naive-blueprint',
      scenarioId: 'netflix-streaming',
      tier: 'naive',
      title: 'Streaming: Centralized Origin Serving & Single-Region API',
      asciiDiagram: `
  [Smart TVs / Mobile Clients]
            │ Full 4K Video Stream Request
            ▼
  ┌────────────────────────────────────────┐
  │         Single App Server Farm         │
  └───────────────────┬────────────────────┘
                      │ Direct File I/O
                      ▼
  ┌────────────────────────────────────────┐
  │     Single Central Storage Server      │
  │    (Saturates WAN Link & Origin I/O)   │
  └────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. Client sends HTTP GET /video/movie.mp4 to central origin server.',
        '2. Origin server streams 5GB video file directly across WAN.',
        '3. 10,000 concurrent streams saturate network interface cards (NICs), causing buffering and crashes.',
      ],
      protocols: ['HTTP/1.1 Range Requests', 'Direct Disk Read'],
      spofsIdentified: [
        'Central Storage Origin (No CDN)',
        'Single Region Control Plane',
        'Monolithic monolithic video file delivery without adaptive bitrate (ABR) chunking',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'nflx-production-blueprint',
      scenarioId: 'netflix-streaming',
      tier: 'production',
      title: 'Streaming: Multi-CDN Edge Delivery with Adaptive Bitrate (ABR) & Multi-Region Active-Active',
      asciiDiagram: `
  [Smart TV / Mobile Player] ──► [Dynamic CDN Selector (Fastly / Cloudflare / Open Connect)]
                                         │ Requests 4-second .m4s video chunks
                                         ▼
                            [Edge Open Connect Appliances (98% Hit Rate)]
                                         │ Origin fallback (2%)
                                         ▼
                            [AWS S3 Multi-Region Origin Storage]

  ── Control Plane (Metadata, Recommendations, DRM Playback License) ──
  [Client App] ──► [Global Route53 Anycast Latency Routing]
                         │
                         ├──────────────────────┬──────────────────────┐
                         ▼                      ▼                      ▼
                  [US-East Region]       [US-West Region]       [EU-Central Region]
                  (Active-Active)        (Active-Active)        (Active-Active)
                         │                      │                      │
                         └──────────────────────┼──────────────────────┘
                                                ▼
                         [Cross-Region Cassandra Distributed Clusters]
      `,
      dataFlowSteps: [
        '1. Videos transcoded ahead-of-time into multi-bitrate HLS/DASH 4-second chunks and stored on S3.',
        '2. Edge CDN appliances (Netflix Open Connect) embedded inside local ISP networks cache 98% of streams.',
        '3. Client player runs BOLA / MPC adaptive bitrate algorithms, dynamically switching quality based on buffer state.',
        '4. Metadata and playback licensing operate across 3 active-active AWS regions with automated Chaos Kong evacuation.',
      ],
      protocols: ['HLS / MPEG-DASH over HTTP/3 (QUIC)', 'gRPC Control Plane', 'Cassandra CQL Replication'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'Multi-CDN redundancy with dynamic real-time chunk failover',
        'Active-Active Multi-Region control plane with Cassandra cross-region replication',
        'Graceful playback degradation with cached offline DRM tokens',
        'Chaos Kong automated regional evacuation within 7 minutes',
      ],
    },
  },

  'url-shortener': {
    naive: {
      id: 'url-naive-blueprint',
      scenarioId: 'url-shortener',
      tier: 'naive',
      title: 'URL Shortener: Hash Truncation with Relational Collision Checks',
      asciiDiagram: `
  [Users (Redirect & Create)]
            │ Synchronous GET /xyz or POST /shorten
            ▼
  ┌────────────────────────────────────────┐
  │        Single Shortener Server         │
  └───────────────────┬────────────────────┘
                      │ MD5(url)[0..6] -> Query DB for collision
                      ▼
  ┌────────────────────────────────────────┐
  │        Single Relational Database      │
  │     (Table Scan & Retry Saturation)    │
  └────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. Client submits long URL. Server hashes URL with MD5 and truncates to first 6 chars.',
        '2. Server queries MySQL: `SELECT id FROM urls WHERE short_code = ?`.',
        '3. If collision exists, server appends salt and queries MySQL again in retry loop.',
        '4. Reads (redirects) hit MySQL on every request without caching or HTTP headers.',
      ],
      protocols: ['HTTP/1.1', 'Direct MySQL Connection'],
      spofsIdentified: [
        'Single App Server & Database',
        'Hash collision retry storm',
        'Zero caching on 100:1 read-to-write workload',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'url-production-blueprint',
      scenarioId: 'url-shortener',
      tier: 'production',
      title: 'URL Shortener: Distributed Base62 Range IDs & Bloom Filter Tiered Cache',
      asciiDiagram: `
  [Global Redirect Requests] ──► [Edge CDN / Cloudflare Caching Layer (301 Permanent)]
                                         │ Cache Miss (~15%)
                                         ▼
                              [Edge Load Balancers (ALB)]
                                         │
                                         ▼
                              [Shortener API Cluster]
                                         │
            ┌────────────────────────────┴────────────────────────────┐
            │ Fast Existence Check                                    │ Read-Through
            ▼                                                         ▼
  [Scalable Bloom Filter (In-Memory)]                       [Redis Cluster (LRU Cache)]
  (Returns 404 in 0.1ms if not found)                       (Hot 20% URLs stored in RAM)
                                                                      │ Cache Miss (1%)
                                                                      ▼
  ── Write Path (Deterministic Non-Colliding ID Generation) ──  [DynamoDB / Cassandra Shards]
  [ZooKeeper / Snowflake Range Service] ──► Allocates 1,000,000 ID ranges per server node
  [Base62 Encoding [0-9a-zA-Z]] ─────────► 62^7 = 3.5 Trillion guaranteed unique keys
      `,
      dataFlowSteps: [
        '1. URL creation: Node grabs next 64-bit integer from its pre-allocated Zookeeper ID range (e.g. 1000000..2000000).',
        '2. Integer encoded directly via Base62 (`125` -> `cb`). Mathematical zero collisions, zero DB round-trips.',
        '3. Bloom filter bitset updated in memory; key-value persisted to distributed DynamoDB.',
        '4. URL redirection: Edge CDN serves 301 Permanent Redirects directly from browser/CDN cache.',
        '5. CDN misses hit Redis in-memory cache (<2ms). Unfound URLs rejected instantly by Bloom filter without hitting DB.',
      ],
      protocols: ['HTTP/2 (301 Permanent Redirect)', 'gRPC Internal', 'RESP (Redis)', 'DynamoDB Low-Latency API'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'Deterministic Base62 eliminates collisions by design',
        'Bloom Filter protects backing database from nonexistent key scans',
        'Multi-layer caching (Browser -> CDN -> Redis) absorbs 99% of read volume',
        'Zookeeper consensus allocates server range leases reliably',
      ],
    },
  },

  'whatsapp-chat': {
    naive: {
      id: 'wa-naive-blueprint',
      scenarioId: 'whatsapp-chat',
      tier: 'naive',
      title: 'Chat: HTTP Polling with Relational Message Store',
      asciiDiagram: `
  [Mobile Clients (50M)]
            │ HTTP Long-Polling every 2 seconds
            ▼
  ┌────────────────────────────────────────┐
  │        Node.js / Java App Server       │
  │     (Thread Exhaustion & High RAM)     │
  └───────────────────┬────────────────────┘
                      │ Synchronous SQL SELECT & INSERT
                      ▼
  ┌────────────────────────────────────────┐
  │         Single Relational DB           │
  │    (Massive Polling Read Saturation)   │
  └────────────────────────────────────────┘
      `,
      dataFlowSteps: [
        '1. 50M phones poll `/messages/poll?userId=123` every 2 seconds.',
        '2. Thread-per-connection architecture exhausts server RAM and file descriptors within minutes.',
        '3. 99% of polling queries return empty result sets while consuming DB CPU.',
        '4. Disconnected users lose messages or cause client delivery desynchronization.',
      ],
      protocols: ['HTTP/1.1 Short/Long Polling', 'JDBC Database Pool'],
      spofsIdentified: [
        'Monolithic polling server cluster',
        'Heavy OS thread memory consumption (~1MB per thread)',
        'Relational DB saturated with empty polling reads',
      ],
      resilienceMechanisms: ['None (Naive Baseline)'],
    },
    production: {
      id: 'wa-production-blueprint',
      scenarioId: 'whatsapp-chat',
      tier: 'production',
      title: 'Chat: Erlang/BEAM WebSocket Edge, Ephemeral Sessions & Dual-ACK Protocol',
      asciiDiagram: `
  [Mobile Clients] ──► [TCP / TLS Termination Anycast Load Balancers]
                              │ Persistent Bidirectional WebSockets / Noise Protocol
                              ▼
                [Erlang/OTP BEAM Connection Gateways]
                (Lightweight processes: 2KB/conn, 2M conns/server)
                              │
            ┌─────────────────┴─────────────────┐
            │ Session Routing Lookup            │ Offline Queueing
            ▼                                   ▼
  [Redis User Session Registry]          [Kafka Message Ingestion Bus]
  (Maps UserId -> GatewayNodeId)                │
            │                                   ▼
            ▼                         [Cassandra Chat History Store]
  [Recipient Gateway Worker]           (Time-partitioned by conversation)
            │ Push WebSocket Frame
            ▼
  [Recipient Mobile Phone] ──► Sends Delivery ACK (Double Checkmark)
      `,
      dataFlowSteps: [
        '1. Mobile clients maintain persistent encrypted WebSocket connection terminated at Erlang/BEAM gateway.',
        '2. Sender sends message frame: Gateway writes message to Kafka and returns immediate "Sent ACK" (Single Check).',
        '3. Gateway queries Redis Session Registry to find Recipient Gateway Node ID.',
        '4. If recipient is online, message pushed directly to active socket; client returns "Delivered ACK" (Double Check).',
        '5. If recipient is offline, message held in Cassandra/Mnesia offline inbox queue and push notification dispatched.',
      ],
      protocols: ['Noise Protocol over WebSockets', 'gRPC Internal Mesh', 'Kafka Event Streaming', 'Cassandra CQL'],
      spofsIdentified: [],
      resilienceMechanisms: [
        'Erlang BEAM lightweight processes support 2M concurrent connections per node',
        'Decoupled connection edge: Gateways are ephemeral; killing a gateway loses zero messages',
        'Dual-ACK state machine guarantees delivery confirmation without distributed locking',
        'Offline message queueing with exponential backoff reconnection jitter',
      ],
    },
  },
};

export class ArchitectureBlueprintViewer {
  public static getBlueprint(
    scenarioId: ScenarioId,
    tier: 'naive' | 'production'
  ): ArchitectureBlueprint {
    return ARCHITECTURE_BLUEPRINTS[scenarioId][tier];
  }

  public static getAllBlueprints(
    scenarioId: ScenarioId
  ): { naive: ArchitectureBlueprint; production: ArchitectureBlueprint } {
    return ARCHITECTURE_BLUEPRINTS[scenarioId];
  }

  public static getSideBySideComparison(scenarioId: ScenarioId): {
    naive: ArchitectureBlueprint;
    production: ArchitectureBlueprint;
  } {
    return ARCHITECTURE_BLUEPRINTS[scenarioId];
  }
}
