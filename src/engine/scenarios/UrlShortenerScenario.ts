/**
 * UrlShortenerScenario — System Design Interview Scenario Specification
 * Problem: Design a Distributed URL Shortening Service (Bitly / TinyURL)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const URL_SHORTENER_SCENARIO: SystemDesignScenario = {
  id: 'url-shortener',
  title: 'Design Scalable URL Shortener (Bitly)',
  subtitle: 'Base62 Bijective Encoding, Snowflake ID Generation & Bloom Filters',
  category: 'core-infrastructure',
  difficulty: 'medium',
  iconName: 'Link',
  summary:
    'Architect a high-performance URL shortening service supporting 10B monthly redirects, collision-free Base62 encoding with Snowflake 64-bit ID generation, and Bloom filter duplicate checks.',
  requirements: {
    functional: [
      'Given a long URL, generate a compact 7-character unique alias (e.g., https://tiny.ly/aZ7x9Q)',
      'Given a short URL alias, redirect the client to the original destination URL instantly',
      'Optional custom alias support with collision detection',
      'Configurable link expiration (TTL) and real-time click analytics',
    ],
    nonFunctional: [
      'Extremely low redirect latency: HTTP 301/302 response < 15ms P99',
      'High availability: 99.999% uptime (redirect failure breaks user browsing)',
      'Read-heavy: 100:1 read-to-write ratio (100M writes/mo vs. 10B reads/mo)',
      'Short links must not be guessable or predictable to prevent link enumeration',
    ],
    dauEstimate: 70_000_000,
    readWriteRatio: '100:1 Read Heavy',
    targetP99Ms: 15,
    targetAvailabilitySla: 99.999,
    maxMonthlyBudgetUsd: 45_000,
  },
  keyConcepts: [
    'Base62 Encoding [0-9, a-z, A-Z]: 62^7 = 3.52 Trillion distinct 7-character combinations',
    'Distributed Unique ID Generation via Twitter Snowflake (Timestamp + NodeID + Sequence)',
    'Bloom Filters at API Gateway tier to immediately reject non-existent short keys in O(1) RAM',
    'Cache-Aside Read Pattern using Redis with Least Recently Used (LRU) memory eviction',
    'HTTP 301 Permanent Redirect (Browser cached) vs. HTTP 302 Temporary Redirect (Tracks analytics)',
    'Sharded Key-Value Store (DynamoDB / Cassandra / Sharded MySQL) with Hash Partitioning on ShortKey',
  ],
  suggestedComponents: [
    'Global Anycast Geo-DNS & Cloudflare Edge CDN',
    'Stateless Redirection Service Fleet',
    'Distributed Snowflake ID Generator Cluster',
    'In-Memory Bloom Filter for Custom Alias Collision Detection',
    'Distributed Redis Cache Cluster (Caching top 20% hottest URLs)',
    'Distributed NoSQL Key-Value Store (Amazon DynamoDB / ScyllaDB)',
  ],
  tradeOffs: [
    'Base62 of Snowflake ID vs. MD5 Hash Truncation: Hash truncation causes hash collisions requiring retry loops; Base62 conversion of unique 64-bit integers guarantees zero collisions.',
    'HTTP 301 vs. HTTP 302: 301 reduces backend server load by caching redirect in client browser; 302 forces every click to hit the server for granular analytics.',
    'Redis Cache vs. Direct DB Read: 80% of redirects hit the top 20% of links (Pareto principle); caching hot keys achieves sub-2ms redirect response times.',
  ],
  targetSlaPercentage: 99.999,
};
