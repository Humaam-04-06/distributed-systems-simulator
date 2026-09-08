/**
 * TwitterFeedScenario — System Design Interview Scenario Specification
 * Problem: Design a Real-Time Scalable Newsfeed System (Twitter / X)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const TWITTER_FEED_SCENARIO: SystemDesignScenario = {
  id: 'twitter-feed',
  title: 'Design Twitter / X Real-Time Newsfeed',
  subtitle: 'High-Throughput Fanout Engine, Timeline Caching & Celebrity Problem',
  category: 'social-media',
  difficulty: 'hard',
  iconName: 'Twitter',
  summary:
    'Architect a global distributed newsfeed supporting 300M DAU with 50:1 read-to-write ratio, sub-100ms timeline fetches, and hybrid push-pull fanout for high-follower accounts.',
  requirements: {
    functional: [
      'Post tweet (max 280 chars, optional media URL) in real-time',
      'Follow and unfollow other users',
      'View home timeline of tweets posted by followed accounts in reverse-chronological order',
      'View user timeline of a specific profile',
    ],
    nonFunctional: [
      'Low latency: Timeline generation < 100ms P99',
      'High availability: 99.99% uptime',
      'Read-heavy: 300,000 timeline reads/sec vs. 6,000 writes/sec',
      'Data durability: No published tweet may be lost once acknowledged',
    ],
    dauEstimate: 300_000_000,
    readWriteRatio: '50:1 Read Heavy',
    targetP99Ms: 95,
    targetAvailabilitySla: 99.99,
    maxMonthlyBudgetUsd: 180_000,
  },
  keyConcepts: [
    'Fanout-on-Write (Push Model) for standard users with < 10k followers',
    'Fanout-on-Read (Pull Model) for Celebrities / Influencers to eliminate fanout amplification',
    'Redis In-Memory Timeline Cache (List of Tweet IDs per active user)',
    'Async Fanout Workers decoupled via Message Queues (Kafka)',
    'User Graph Database (FlockDB / Neo4j) for bidirectional follower lookups',
    'Blob Storage (S3 / CDN) for media attachments with aggressive edge caching',
  ],
  suggestedComponents: [
    'Global Anycast Geo-DNS & API Gateway',
    'Layer 7 Load Balancer with Consistent Hashing on UserID',
    'Stateless Tweet Write & Timeline Read Microservices',
    'Distributed In-Memory Cache Cluster (Redis Sentinel / Cluster)',
    'Distributed Database Cluster (PostgreSQL + Read Replicas + Sharding)',
    'Message Queue Pub/Sub Cluster for Async Push Workers',
  ],
  tradeOffs: [
    'Push vs. Pull Fanout: Push provides sub-10ms read latency but wastes compute for inactive users and bottlenecks on celebrities. Hybrid solves both.',
    'Tweet ID List vs. Full Tweet Hydration in Cache: Caching only tweet IDs saves 85% memory; tweets hydrated in single multi-get batch.',
    'Eventual Consistency vs. Strong Consistency: Timelines accept eventual consistency (2-5s lag) to achieve 99.99% availability under CAP theorem.',
  ],
  targetSlaPercentage: 99.99,
};
