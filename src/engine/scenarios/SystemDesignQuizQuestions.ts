/**
 * SystemDesignQuizQuestions — Curated Staff Engineer Technical Quiz Questions
 * 
 * Contains 18 high-yield multiple-choice interview questions (3 per scenario)
 * testing partitioning, consistency, cache invalidation, and failure isolation.
 */

import { ScenarioId } from './ScenarioTypes';

export interface SystemDesignQuizQuestion {
  id: string;
  scenarioId: ScenarioId;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  conceptTag: string;
}

export const SYSTEM_DESIGN_QUIZ_QUESTIONS: SystemDesignQuizQuestion[] = [
  // 1. Twitter Feed
  {
    id: 'tw-q1',
    scenarioId: 'twitter-feed',
    question: 'Why does Twitter use Fanout-on-Read (Pull) rather than Fanout-on-Write (Push) for celebrity accounts?',
    options: [
      'Celebrity tweets are read less frequently by users',
      'Push fanout to tens of millions of followers causes catastrophic write amplification and Redis queue backlog',
      'Pull fanout completely eliminates the need for any caching tier',
      'Relational databases cannot store celebrity usernames',
    ],
    correctAnswerIndex: 1,
    explanation: 'A single tweet from an account with 100M followers would require 100M Redis list writes under a pure push model. Pulling celebrity tweets on-the-fly and merging them at read time prevents write pipeline saturation.',
    conceptTag: 'Fanout Strategies',
  },
  {
    id: 'tw-q2',
    scenarioId: 'twitter-feed',
    question: 'What is the standard memory cap per user timeline in Redis for Twitter-scale systems?',
    options: [
      'Every tweet ever posted by the user (infinite list)',
      'Only the single latest tweet',
      'Around 800 to 1,000 recent tweet IDs (older tweets fetched on-demand from disk DB)',
      'All tweets posted within the last 5 years',
    ],
    correctAnswerIndex: 2,
    explanation: 'Since 99% of user timeline scrolling never exceeds 800 tweets, capping the in-memory list to 800 tweet IDs keeps RAM usage predictable and bounded.',
    conceptTag: 'Cache Sizing',
  },
  {
    id: 'tw-q3',
    scenarioId: 'twitter-feed',
    question: 'How does Twitter ensure sub-second timeline delivery under high partition skew?',
    options: [
      'Using Consistent Hashing with Virtual Nodes across Redis cluster shards',
      'Routing all timeline traffic to a single monolithic MySQL server',
      'Disabling replication to avoid cross-data-center latency',
      'Polling every mobile client every 100 milliseconds',
    ],
    correctAnswerIndex: 0,
    explanation: 'Consistent hashing with virtual nodes evenly distributes user timeline keys across the cache cluster and prevents hot-spot shards.',
    conceptTag: 'Consistent Hashing',
  },

  // 2. Uber Ride Matching
  {
    id: 'ub-q1',
    scenarioId: 'uber-ride-matching',
    question: 'What mathematical advantage do H3 Hexagonal cells offer over square Geohash grids in ride matching?',
    options: [
      'Hexagons require less RAM storage per coordinate',
      'All 6 adjacent neighboring cells have exactly equal center-to-center distances, eliminating diagonal corner distortion',
      'Hexagons can only be rendered in 3D graphics',
      'Square geohashes cannot encode negative latitude values',
    ],
    correctAnswerIndex: 1,
    explanation: 'In a square grid, orthogonal neighbors are distance D away, but diagonal neighbors are sqrt(2)*D away (~41% further). Hexagons have identical distances to all 6 adjacent neighbors.',
    conceptTag: 'Spatial Indexing',
  },
  {
    id: 'ub-q2',
    scenarioId: 'uber-ride-matching',
    question: 'Why should real-time driver GPS pings (every 4s) be decoupled from the dispatch transactional database?',
    options: [
      'Driver pings contain sensitive credit card information',
      'High-frequency ephemeral writes would saturate relational WAL logs and trigger database lock contention',
      'GPS pings do not use IP networking',
      'Dispatchers only query driver locations once per hour',
    ],
    correctAnswerIndex: 1,
    explanation: 'Driver location pings are ephemeral time-series telemetry. Storing millions of 4-second pings in an in-memory spatial index (like Redis GEO) protects the transactional booking database from write exhaustion.',
    conceptTag: 'Write Isolation',
  },
  {
    id: 'ub-q3',
    scenarioId: 'uber-ride-matching',
    question: 'How should dynamic surge pricing multipliers be calculated to prevent thundering herd dispatch oscillations?',
    options: [
      'Recalculating surge synchronously inside the rider checkout transaction',
      'Background worker jobs computing supply/demand rolling windows with hysteresis smoothing per H3 cell',
      'Setting surge multiplier to 5.0x permanently across all regions',
      'Asking drivers to vote on prices in real time',
    ],
    correctAnswerIndex: 1,
    explanation: 'Decoupled background aggregation with hysteresis prevents rapid flip-flopping of surge pricing when drivers cross cell boundaries.',
    conceptTag: 'Dynamic Pricing',
  },

  // 3. Black Friday Flash Sale
  {
    id: 'bf-q1',
    scenarioId: 'black-friday-sale',
    question: 'What is the primary risk of using SQL SELECT FOR UPDATE during a 100,000 QPS flash sale?',
    options: [
      'Database disk runs out of physical space immediately',
      'Row-level lock contention serializes transactions, causing connection pool exhaustion and cascading timeouts',
      'Relational databases cannot perform subtraction operations',
      'MySQL requires HTTPS encryption for all SELECT queries',
    ],
    correctAnswerIndex: 1,
    explanation: 'SELECT FOR UPDATE locks the inventory row. When tens of thousands of threads queue up for that single lock, thread pools and connection pools exhaust, causing 504 gateway timeouts across the application.',
    conceptTag: 'Lock Contention',
  },
  {
    id: 'bf-q2',
    scenarioId: 'black-friday-sale',
    question: 'How does an atomic Redis Lua script guarantee 100% oversell prevention?',
    options: [
      'Redis executes Lua scripts in a multi-threaded parallel pool',
      'Redis executes Lua scripts single-threaded and atomically without interruption between GET and DECR',
      'Lua scripts automatically double the inventory count when stock is low',
      'Redis Lua scripts send synchronous RPCs to credit card payment gateways',
    ],
    correctAnswerIndex: 1,
    explanation: 'Redis executes scripts atomically on its single-threaded event loop. No other command or script can run between checking stock and decrementing stock, eliminating race conditions.',
    conceptTag: 'Concurrency Control',
  },
  {
    id: 'bf-q3',
    scenarioId: 'black-friday-sale',
    question: 'What role does a Virtual Waiting Room play in front of flash sale checkout services?',
    options: [
      'Displays advertisements to generate ad revenue',
      'Acts as a traffic admission governor, holding surplus users in queue and only passing downstream the exact capacity the payment gateway can handle',
      'Converts JSON payloads into XML for legacy payment processors',
      'Encrypts user passwords using SHA-1',
    ],
    correctAnswerIndex: 1,
    explanation: 'A Virtual Waiting Room acts as an ingress shock-absorber, protecting fragile downstream fulfillment and payment systems from being overwhelmed.',
    conceptTag: 'Rate Limiting & Admission',
  },

  // 4. Netflix Streaming
  {
    id: 'nf-q1',
    scenarioId: 'netflix-streaming',
    question: 'Why does Netflix install custom Open Connect CDN appliances directly inside ISP exchange points?',
    options: [
      'To bypass copyright laws in foreign countries',
      'To serve over 95% of video chunk requests from local ISP caches, eliminating transit costs and WAN latency',
      'Because AWS S3 does not allow video files larger than 10MB',
      'To encode subtitles in real time on the viewer device',
    ],
    correctAnswerIndex: 1,
    explanation: 'Serving petabytes of video directly within consumer ISPs avoids expensive transit provider fees and places chunks within single-digit milliseconds of viewer TVs.',
    conceptTag: 'Edge Caching',
  },
  {
    id: 'nf-q2',
    scenarioId: 'netflix-streaming',
    question: 'How does Adaptive Bitrate (ABR) streaming prevent video playback stalls on variable mobile networks?',
    options: [
      'By pausing playback until the entire 2-hour movie is downloaded to phone storage',
      'By slicing video into small chunks (2-4 seconds) encoded at multiple bitrates, allowing the client player to dynamically switch bitrates based on measured download speed',
      'By downsampling audio tracks to 8kHz mono permanently',
      'By forcing users to connect to 5G WiFi networks',
    ],
    correctAnswerIndex: 1,
    explanation: 'ABR clients measure download speed of each 2-second chunk. If throughput drops, the player requests the next segment at 720p or 480p to prevent buffer under-runs.',
    conceptTag: 'Media Delivery',
  },
  {
    id: 'nf-q3',
    scenarioId: 'netflix-streaming',
    question: 'What is the purpose of an "Origin Shield" tier in video distribution architectures?',
    options: [
      'Protects video files from hackers using cryptographic hardware tokens',
      'Aggregates cache misses from hundreds of edge CDN POPs before they reach master cloud object storage',
      'Deletes corrupted video files automatically after 24 hours',
      'Blocks viewers who have not paid their monthly subscription',
    ],
    correctAnswerIndex: 1,
    explanation: 'An Origin Shield acts as a centralized caching barrier. Multiple edge POPs experiencing cache misses fetch from the shield rather than overwhelming origin storage.',
    conceptTag: 'Tiered Caching',
  },

  // 5. URL Shortener (Bitly)
  {
    id: 'url-q1',
    scenarioId: 'url-shortener',
    question: 'How many unique URLs can be represented by a 7-character Base62 string ([a-zA-Z0-9])?',
    options: [
      'Around 1 million URLs',
      '62^7 ≈ 3.52 trillion unique URLs',
      'Exactly 1 billion URLs',
      '2^64 URLs',
    ],
    correctAnswerIndex: 1,
    explanation: 'Base62 has 62 characters (10 digits + 26 lowercase + 26 uppercase). 62^7 = 3,521,614,606,208 (approx 3.5 trillion), which accommodates decades of billions of links.',
    conceptTag: 'Encoding & Capacity',
  },
  {
    id: 'url-q2',
    scenarioId: 'url-shortener',
    question: 'Why place a Bloom Filter in front of the short URL database?',
    options: [
      'To compress long URLs before inserting them into tables',
      'To instantly detect non-existent short keys in memory with zero false negatives, preventing disk I/O on 404 scanning attacks',
      'To sort URLs in alphabetical order',
      'To generate random passwords for user accounts',
    ],
    correctAnswerIndex: 1,
    explanation: 'A Bloom filter provides O(1) bit array checking. If the filter returns false, the short URL definitely does not exist, saving an expensive database query.',
    conceptTag: 'Probabilistic Data Structures',
  },
  {
    id: 'url-q3',
    scenarioId: 'url-shortener',
    question: 'What is the trade-off between HTTP 301 Permanent and HTTP 302 Temporary Redirects for a URL shortener?',
    options: [
      'HTTP 301 is encrypted while HTTP 302 is plaintext',
      'HTTP 301 caches redirects in the browser (saves server load, but loses click analytics); HTTP 302 forces requests to hit the server (enables accurate click tracking)',
      'HTTP 301 only works on desktop computers while HTTP 302 is mobile only',
      'There is zero functional or caching difference between them',
    ],
    correctAnswerIndex: 1,
    explanation: 'Browsers cache 301 redirects aggressively, meaning subsequent clicks bypass the shortener server. 302 ensures every click passes through the server for real-time analytics.',
    conceptTag: 'HTTP Semantics',
  },

  // 6. WhatsApp Chat
  {
    id: 'wa-q1',
    scenarioId: 'whatsapp-chat',
    question: 'Why does WhatsApp use Cassandra / ScyllaDB for message storage rather than a normalized relational SQL database?',
    options: [
      'Cassandra is free while SQL databases require proprietary hardware licenses',
      'Cassandra’s LSM-tree engine writes sequentially to commit log and memtables, providing ultra-high write throughput without B-Tree lock overhead',
      'Relational databases cannot store emojis or text strings longer than 10 words',
      'Cassandra automatically translates messages between different languages',
    ],
    correctAnswerIndex: 1,
    explanation: 'Cassandra append-only LSM-tree storage delivers sub-millisecond sequential writes. Messages partitioned by (conversation_id, time_bucket) allow high horizontal scaling.',
    conceptTag: 'LSM Storage',
  },
  {
    id: 'wa-q2',
    scenarioId: 'whatsapp-chat',
    question: 'How does the WhatsApp gateway layer manage millions of idle persistent WebSocket connections efficiently?',
    options: [
      'Spawning 1 OS operating system thread per connection',
      'Non-blocking I/O event loops (epoll on Linux / kqueue on BSD) holding 50k+ sockets per process with low memory overhead',
      'Restarting gateway servers every 60 seconds to clear sockets',
      'Closing connections immediately after each message and having mobile apps reconnect',
    ],
    correctAnswerIndex: 1,
    explanation: 'Epoll/kqueue event-driven I/O multiplexes tens of thousands of concurrent TCP sockets onto a small pool of worker threads, avoiding thread stack memory exhaustion.',
    conceptTag: 'Network Multiplexing',
  },
  {
    id: 'wa-q3',
    scenarioId: 'whatsapp-chat',
    question: 'What is the correct protocol sequence for WhatsApp’s dual-ACK message delivery lifecycle?',
    options: [
      '1. Read -> 2. Delivered -> 3. Sent',
      '1. Sent ACK (Server commits message) -> 2. Delivered ACK (Recipient pulls message) -> 3. Read ACK (Recipient opens chat)',
      'Single ACK sent only when recipient replies to the message',
      'Messages are never acknowledged over TCP',
    ],
    correctAnswerIndex: 1,
    explanation: 'The three states correspond to single grey tick (Sent to server), double grey tick (Delivered to recipient device), and double blue tick (Read by user).',
    conceptTag: 'Delivery Semantics',
  },
];

export class SystemDesignQuizCatalog {
  public static getAll(): SystemDesignQuizQuestion[] {
    return SYSTEM_DESIGN_QUIZ_QUESTIONS;
  }

  public static getByScenario(scenarioId: ScenarioId): SystemDesignQuizQuestion[] {
    return SYSTEM_DESIGN_QUIZ_QUESTIONS.filter((q) => q.scenarioId === scenarioId);
  }

  public static getById(id: string): SystemDesignQuizQuestion | undefined {
    return SYSTEM_DESIGN_QUIZ_QUESTIONS.find((q) => q.id === id);
  }
}
