import { ScenarioId } from './ScenarioTypes';

export interface FailureModeCaseStudy {
  id: string;
  scenarioId: ScenarioId;
  title: string;
  realWorldIncident: string;
  incidentYear: number;
  companyOrContext: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  durationHours: number;
  estimatedImpact: string;
  symptoms: string[];
  rootCause: string;
  naiveArchitecturalFlaw: string;
  staffEngineeringRemediation: string[];
  keyTakeaway: string;
}

export const FailureModeCaseStudies: Record<ScenarioId, FailureModeCaseStudy[]> = {
  'twitter-feed': [
    {
      id: 'tw-fail-whale-2010',
      scenarioId: 'twitter-feed',
      title: 'The Infamous "Fail Whale" Cascading Fanout Saturation',
      realWorldIncident: 'Twitter 2010 FIFA World Cup repeated outages & fail whale screen',
      incidentYear: 2010,
      companyOrContext: 'Twitter',
      severity: 'CRITICAL',
      durationHours: 120,
      estimatedImpact: 'Millions of users saw Fail Whale graphic during peak matches; ~20% tweet drop',
      symptoms: [
        'Massive write latency spike exceeding 30 seconds for popular accounts',
        'Database worker thread pool exhaustion across primary MySQL shards',
        'Cascading HTTP 503 Service Unavailable errors returned to client apps',
      ],
      rootCause:
        'Synchronous Fan-out on Write: When a user with 10M+ followers tweeted, the system attempted to synchronously insert 10M inbox rows across distributed database shards, starving all standard tweet traffic.',
      naiveArchitecturalFlaw:
        'Treating all users uniformly with eager write fan-out, coupling author ingestion with follower timeline materialization.',
      staffEngineeringRemediation: [
        'Adopt Hybrid Push/Pull Fanout: Normal users (<25k followers) fan out on write to Redis; celebrities (>25k followers) fan in on read during timeline request.',
        'Decouple timeline updates with Kafka message brokers to buffer celebrity tweet spikes.',
        'Implement circuit breakers (e.g. Resilience4j / Envoy) on timeline generation services.',
      ],
      keyTakeaway:
        'Identify asymmetric power-law distributions (celebrity write amplification) early and segment traffic into distinct write-fanout vs. read-fanout pipelines.',
    },
    {
      id: 'tw-redis-cluster-partition',
      scenarioId: 'twitter-feed',
      title: 'Timeline Cache Cold-Start Thundering Herd',
      realWorldIncident: 'Large-scale Redis cluster cache flush during cluster upgrade',
      incidentYear: 2014,
      companyOrContext: 'Social Media Scale',
      severity: 'HIGH',
      durationHours: 4,
      estimatedImpact: '35% degradation in timeline load times, 15x spike in database read load',
      symptoms: [
        'Cache hit ratio dropped from 99.2% to 41.5%',
        'Postgres read replicas CPU pinned at 100%',
        'Database connection pool starvation',
      ],
      rootCause:
        'Simultaneous cache invalidation without read-through request coalescing (Singleflight/Mutex), causing thousands of parallel timeline queries for the same active accounts.',
      naiveArchitecturalFlaw:
        'Cache-aside without mutual exclusion or probabilistic early expiration (XFetch), causing thundering herds on cache miss.',
      staffEngineeringRemediation: [
        'Implement Singleflight request deduplication so only 1 query hits the database while waiting concurrent requests share the result.',
        'Stagger cache TTLs with random jitter (e.g. TTL = 3600s + rand(0, 300s)).',
        'Pre-warm timeline caches before promoting standby cache clusters.',
      ],
      keyTakeaway:
        'A high cache hit ratio can mask an unsustainable database fallback. Always design for cold-start survivability.',
    },
  ],

  'uber-ride-matching': [
    {
      id: 'uber-nye-gridlock-2016',
      scenarioId: 'uber-ride-matching',
      title: 'New Year’s Eve Spatial Shard Hotspot & Driver Lockout',
      realWorldIncident: 'Uber New Year’s Eve 2016 surge dispatch contention in major metros',
      incidentYear: 2016,
      companyOrContext: 'Ride-Hailing Global',
      severity: 'CRITICAL',
      durationHours: 3,
      estimatedImpact: 'Over 150,000 rides delayed or cancelled; surge multiplier calculations frozen',
      symptoms: [
        'Geohash cell lookup latency jumped from 12ms to 4,200ms in Times Square / central London',
        'Optimistic lock conflicts causing ride assignment failures > 40%',
        'Driver status synchronization desyncs (drivers shown as available but already matched)',
      ],
      rootCause:
        'Fixed-resolution spatial hashing created massive hotspotting in dense city centers. Thousands of rider requests contended for lock acquisition on the same 100 available drivers in a single geohash bucket.',
      naiveArchitecturalFlaw:
        'Single distributed lock per geohash bucket and synchronous relational database updates for location pings every 4 seconds.',
      staffEngineeringRemediation: [
        'Migrate from static Geohash to Uber H3 hierarchical hexagonal spatial indexing with dynamic cell splitting.',
        'Decouple location ingestion into Ringpop/Redis in-memory geospatial indexes, offloading relational databases.',
        'Use batched matching algorithms (Hungarian algorithm in 5-second match windows) rather than first-come-first-served greedy locking.',
      ],
      keyTakeaway:
        'Continuous high-velocity telemetry (GPS pings) must never write directly to durable disk storage; use memory-first spatial indexes and batched discrete-time matching.',
    },
    {
      id: 'uber-driver-split-brain',
      scenarioId: 'uber-ride-matching',
      title: 'Cross-Datacenter Location Split-Brain',
      realWorldIncident: 'Network partition between US-West and US-East dispatch datacenters',
      incidentYear: 2018,
      companyOrContext: 'Ride-Hailing Infra',
      severity: 'HIGH',
      durationHours: 2,
      estimatedImpact: 'Drivers received dual dispatch offers; cancellation rate spiked to 28%',
      symptoms: [
        'Inconsistent driver states across regions (Driver marked "Accepted" in East, "Idle" in West)',
        'Double-booking of vehicles',
      ],
      rootCause:
        'Multi-primary active-active replication without partition consensus fencing for ephemeral driver state.',
      naiveArchitecturalFlaw:
        'Treating stateful ride dispatching as globally distributed multi-master without sticky regional routing.',
      staffEngineeringRemediation: [
        'Enforce strict Geo-Affinity: City-level routing guarantees that all rides in a metropolitan area are pinned to a single authoritative region.',
        'Use Raft/Paxos based consensus for driver dispatch leases.',
        'Equip mobile apps with idempotency tokens for all ride acceptance calls.',
      ],
      keyTakeaway:
        'Physical geography naturally partitions ride-sharing; take advantage of geo-affinity to avoid cross-region distributed transactions.',
    },
  ],

  'black-friday-sale': [
    {
      id: 'bf-flash-oversell-deadlock',
      scenarioId: 'black-friday-sale',
      title: 'Flash Sale Relational Row Locking & Overselling Catastrophe',
      realWorldIncident: 'Major e-commerce marketplace Black Friday 99% off smartphone flash sale',
      incidentYear: 2019,
      companyOrContext: 'Global E-Commerce Giant',
      severity: 'CRITICAL',
      durationHours: 6,
      estimatedImpact: '50,000 units sold with only 5,000 units in physical warehouse; $3.2M customer compensation',
      symptoms: [
        'Postgres inventory table experienced 100% deadlock exceptions on `SELECT ... FOR UPDATE`',
        'Checkout service gateway timed out after 30 seconds',
        'Inventory counter dipped into negative numbers (-45,000)',
      ],
      rootCause:
        'Concurrent checkout requests executed non-atomic read-then-write checks against a relational database with insufficient isolation level, resulting in dirty reads and lock queue exhaustion.',
      naiveArchitecturalFlaw:
        'Using database row locks for inventory reservation under 50,000 RPS flash sale conditions.',
      staffEngineeringRemediation: [
        'Atomic In-Memory Reservation: Use Redis single-threaded atomic Lua scripts (`DECRBY` with check `if remaining >= qty`) for instant rejection once inventory is exhausted.',
        'Pre-tokenization: Issue signed inventory reservation tokens with 10-minute TTLs before allowing access to payment flow.',
        'Asynchronous Order Finalization: Send confirmed reservations to Kafka for background settlement with payment gateways.',
      ],
      keyTakeaway:
        'Under extreme burst traffic, drop synchronous relational writes. Protect the system using in-memory atomic token buckets and fail-fast backpressure.',
    },
    {
      id: 'bf-payment-gateway-timeout',
      scenarioId: 'black-friday-sale',
      title: 'Payment Gateway Cascading Connection Exhaustion',
      realWorldIncident: 'Third-party payment processor latency degradation during cyber week',
      incidentYear: 2021,
      companyOrContext: 'Retail Tech Group',
      severity: 'HIGH',
      durationHours: 5,
      estimatedImpact: '$8.5M in abandoned shopping carts; checkout error rate reached 68%',
      symptoms: [
        'Upstream payment provider latency increased from 350ms to 24,000ms',
        'Application server Tomcat thread pools completely exhausted',
        'Incoming web requests queued indefinitely at load balancers',
      ],
      rootCause:
        'No timeout, bulkheading, or circuit breaking on external HTTP calls to payment processors. Slow third-party responses tied up internal application threads until the entire service crashed.',
      naiveArchitecturalFlaw:
        'Direct synchronous calls to external third parties on user HTTP request threads without isolation.',
      staffEngineeringRemediation: [
        'Implement Bulkhead Pattern: Restrict external payment calls to a dedicated thread pool (max 50 threads).',
        'Configure aggressive circuit breakers (tripping to open state if 50% of requests exceed 3s over 10s window).',
        'Asynchronous Webhook Settlement: Return "Order Processing" immediately and confirm payment asynchronously via webhook.',
      ],
      keyTakeaway:
        'Never trust external downstream services. Bulkhead third-party integrations with strict timeouts and circuit breakers to prevent systemic collapse.',
    },
  ],

  'netflix-streaming': [
    {
      id: 'nflx-aws-east-outage-2012',
      scenarioId: 'netflix-streaming',
      title: 'Christmas Eve AWS US-East-1 DynamoDB & ELB Cascade',
      realWorldIncident: 'AWS us-east-1 catastrophic multi-AZ degradation on Christmas Eve 2012',
      incidentYear: 2012,
      companyOrContext: 'Netflix',
      severity: 'CRITICAL',
      durationHours: 18,
      estimatedImpact: 'Millions of viewers unable to stream movies across North America on Christmas Eve',
      symptoms: [
        'Video metadata and bookmark services completely unresponsive',
        'Edge CDN unable to refresh origin tokens for DRM playback',
        'Play button failed with generic error codes on smart TVs',
      ],
      rootCause:
        'Single-Region Dependency: Although video files were distributed across edge CDNs, the playback authorization and metadata API relied strictly on AWS us-east-1.',
      naiveArchitecturalFlaw:
        'Distributing static video chunks on CDNs while keeping the control plane and user bookmark database tied to a single cloud region.',
      staffEngineeringRemediation: [
        'Engineer Multi-Region Active-Active Architecture: Replicate user states and metadata across 3 geographic regions (US-East, US-West, EU-West) with Cassandra cross-region replication.',
        'Chaos Kong: Regularly simulate dropping entire AWS regions in production to prove automatic traffic evacuation within 7 minutes.',
        'Graceful Playback Fallback: Allow client apps to play cached content with local fallback DRM licenses if the catalog service is degraded.',
      ],
      keyTakeaway:
        'CDN caching of media assets is worthless if the metadata and playback entitlement control plane is a single point of failure.',
    },
    {
      id: 'nflx-adaptive-bitrate-oscillation',
      scenarioId: 'netflix-streaming',
      title: 'ABR Buffer Oscillation and Bandwidth Thrashing',
      realWorldIncident: 'Subsea fiber cable degradation causing ABR algorithm hunting',
      incidentYear: 2017,
      companyOrContext: 'Streaming CDN Edge',
      severity: 'MEDIUM',
      durationHours: 8,
      estimatedImpact: 'Severe video quality jumping between 480p and 4K every 6 seconds for 400,000 subscribers',
      symptoms: [
        'Buffer underruns and playback stuttering',
        'High rate of client chunk re-requests to alternate CDN nodes',
      ],
      rootCause:
        'Aggressive adaptive bitrate (ABR) algorithm measuring instantaneous throughput rather than moving harmonic mean buffer state, causing unstable oscillations.',
      naiveArchitecturalFlaw:
        'Purely throughput-based bitrate switching without buffer-based smoothing and hysteresis margins.',
      staffEngineeringRemediation: [
        'Deploy BOLA (Buffer-Occupancy based Lyapunov Algorithm) and MPC (Model Predictive Control) ABR algorithms.',
        'Dual-CDN dynamic chunk switching to seamlessly failover individual chunks between Fastly and Cloudflare.',
        'Encode video with Per-Title / Per-Chunk optimization to minimize bitrate leaps.',
      ],
      keyTakeaway:
        'Adaptive streaming algorithms must optimize for buffer health stability rather than chasing noisy instantaneous bandwidth spikes.',
    },
  ],

  'url-shortener': [
    {
      id: 'url-bloom-filter-false-positive',
      scenarioId: 'url-shortener',
      title: 'Counter Collision & Distributed Lock Exhaustion',
      realWorldIncident: 'Shortener collision cascade during celebrity viral campaign',
      incidentYear: 2018,
      companyOrContext: 'High-Volume Link Platform',
      severity: 'HIGH',
      durationHours: 3,
      estimatedImpact: 'Over 800,000 generated links returned 409 Conflict or redirected to wrong URLs',
      symptoms: [
        'Random hash generation produced collisions at high volume (Birthday Paradox)',
        'Database conflict retry loops caused 100% CPU utilization on master',
        'Link creation latency degraded from 8ms to 1,900ms',
      ],
      rootCause:
        'MD5/SHA256 truncated hash collision detection relied on checking the database upon collision. Under burst traffic, collision probability rose exponentially and saturated the write pipeline.',
      naiveArchitecturalFlaw:
        'Generating short codes via hash truncation with optimistic retry loops against relational database.',
      staffEngineeringRemediation: [
        'Switch to Deterministic Counter-Based Base62 Encoding: Use distributed ticket servers (Flickr style or Twitter Snowflake / Zookeeper ranges) to allocate non-colliding integer ranges (e.g. Server 1 gets 1-1,000,000).',
        'Employ in-memory Scalable Bloom Filters to check short code existence in 0.1ms with zero false negatives.',
        'Implement Base62 encoding `[0-9a-zA-Z]` guaranteeing 62^7 = 3.5 trillion unique 7-character URLs with zero collisions.',
      ],
      keyTakeaway:
        'Never use truncated cryptographic hashes for unique identifiers when deterministic distributed counter allocation eliminates collisions mathematically.',
    },
    {
      id: 'url-cache-stampede-viral-tweet',
      scenarioId: 'url-shortener',
      title: 'Viral Breaking News URL Cache Stampede',
      realWorldIncident: 'Global news alert shortened link with 250,000 RPS cache expiration',
      incidentYear: 2020,
      companyOrContext: 'Global Shortener Service',
      severity: 'HIGH',
      durationHours: 1.5,
      estimatedImpact: 'Primary database replica crashed; 301 redirects delayed by 8 seconds',
      symptoms: [
        'Cache hit ratio plummeted from 99.8% to 60% for a single key during 5-minute TTL expiry',
        '100,000 concurrent requests bypassed cache to query the same database row simultaneously',
      ],
      rootCause:
        'Key expired in Redis while receiving 250,000 RPS. Every incoming request saw a cache miss and fired a query to the relational database simultaneously.',
      naiveArchitecturalFlaw:
        'Standard cache-aside with hard TTL expiration and no request coalescing or early background refresh.',
      staffEngineeringRemediation: [
        'XFetch Probabilistic Early Expiration: Recalculate cache asynchronously before expiration based on read frequency and computation cost.',
        'Distributed Singleflight / Mutual Exclusion Lock on cache miss: First request acquires lease to refresh cache, other 99,999 requests wait on in-memory promise.',
        'Configure HTTP 301 Permanent Redirect with `Cache-Control: public, max-age=86400` so browser and edge CDNs serve redirects without hitting shortener backend.',
      ],
      keyTakeaway:
        'Take advantage of HTTP 301 client and CDN caching; for backend caches, implement probabilistic early refresh to survive viral traffic.',
    },
  ],

  'whatsapp-chat': [
    {
      id: 'wa-midnight-tsunami-2014',
      scenarioId: 'whatsapp-chat',
      title: 'New Year’s Eve Midnight TCP Gateway Connection Tsunami',
      realWorldIncident: 'WhatsApp New Year’s Eve 2014 midnight message volume surge (54 billion messages in 24 hours)',
      incidentYear: 2014,
      companyOrContext: 'WhatsApp / Erlang Infrastructure',
      severity: 'CRITICAL',
      durationHours: 4,
      estimatedImpact: 'Message delivery delay reached 45 minutes in multiple countries; reconnection storms',
      symptoms: [
        'TCP SYN backlog queues overflowed on edge gateways',
        'Kernel socket buffer memory exhausted (`net.ipv4.tcp_mem` limit reached)',
        'Client apps severed connections and entered aggressive reconnect loops, worsening load',
      ],
      rootCause:
        'Simultaneous connection drops triggered an thundering herd reconnection storm. 100M+ phones attempted to re-establish TLS handshakes and download queued messages simultaneously.',
      naiveArchitecturalFlaw:
        'Thread-per-connection architecture (e.g. standard Java/Node) with linear memory overhead and aggressive client reconnect without exponential backoff jitter.',
      staffEngineeringRemediation: [
        'Erlang/OTP BEAM Architecture: Leverage lightweight BEAM processes (~2KB per connection) allowing 2M+ concurrent idle WebSockets per physical server.',
        'Client-Side Exponential Backoff with Jitter: Ensure clients retry failed handshakes with `t = min(max_interval, base * 2^attempt + rand(0, jitter))`.',
        'Decouple Connection Edge from Message Storage: Ephemeral connection gateways do not hold message state; messages queue in distributed Cassandra/Mnesia clusters.',
      ],
      keyTakeaway:
        'Handling millions of persistent connections requires lightweight user-space concurrency primitives and disciplined client reconnection backoff policies.',
    },
    {
      id: 'wa-group-chat-fanout-amplification',
      scenarioId: 'whatsapp-chat',
      title: 'Large Group Chat Message Fan-out Queue Starvation',
      realWorldIncident: 'Viral media broadcast across 1024-member groups during election',
      incidentYear: 2022,
      companyOrContext: 'Secure Messaging Platform',
      severity: 'HIGH',
      durationHours: 2.5,
      estimatedImpact: '1-on-1 direct message delivery delayed behind massive group fan-out queues',
      symptoms: [
        'Delivery receipt (double-check) latency climbed from 80ms to 9,500ms',
        'Message queue depth for recipient gateways grew to 40M items',
      ],
      rootCause:
        'Head-of-Line Blocking: 1-on-1 private messages shared the same priority queues as 1024-member group broadcasts. A single message sent to 500 large groups generated 500,000 queue entries, delaying urgent 1-on-1 communications.',
      naiveArchitecturalFlaw:
        'Single FIFO queue per user mailbox mixing low-fanout interactive chats with high-fanout broadcast events.',
      staffEngineeringRemediation: [
        'Priority Queues / Multi-Lane Dispatch: Separate message processing into interactive 1-on-1 lane (P0) and group broadcast lane (P1).',
        'Server-Side Encryption Key Distribution with Sender Keys: Allow client to encrypt once with a sender key and broadcast, instead of pairwise encrypting 1024 times.',
        'Batched Gateway Delivery: Push batched message envelopes to connected sockets rather than single-message frames.',
      ],
      keyTakeaway:
        'Never allow high-fanout bulk operations to share queue capacity with high-priority interactive human conversations.',
    },
  ],
};

export class FailureModeMatrix {
  public static getCaseStudies(scenarioId: ScenarioId): FailureModeCaseStudy[] {
    return FailureModeCaseStudies[scenarioId] || [];
  }

  public static getCaseStudyById(id: string): FailureModeCaseStudy | undefined {
    for (const studies of Object.values(FailureModeCaseStudies)) {
      const match = studies.find((s) => s.id === id);
      if (match) return match;
    }
    return undefined;
  }

  public static getAllCaseStudies(): FailureModeCaseStudy[] {
    return Object.values(FailureModeCaseStudies).flat();
  }

  public static getCriticalCaseStudies(): FailureModeCaseStudy[] {
    return this.getAllCaseStudies().filter((s) => s.severity === 'CRITICAL');
  }
}
