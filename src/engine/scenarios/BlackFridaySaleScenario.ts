/**
 * BlackFridaySaleScenario — System Design Interview Scenario Specification
 * Problem: Design an E-Commerce Flash Sale & Inventory Reservation System (Black Friday)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const BLACK_FRIDAY_SALE_SCENARIO: SystemDesignScenario = {
  id: 'black-friday-sale',
  title: 'Design Black Friday Flash Sale & Inventory Engine',
  subtitle: 'Atomic Concurrency, Zero-Oversell Locks & Virtual Waiting Rooms',
  category: 'e-commerce',
  difficulty: 'hard',
  iconName: 'ShoppingBag',
  summary:
    'Architect a resilient flash-sale checkout pipeline capable of absorbing 100x traffic spikes, guaranteeing zero inventory oversell under extreme lock contention, and preventing database collapse via virtual waiting rooms.',
  requirements: {
    functional: [
      'Users view real-time product inventory and flash sale countdown',
      'Users click "Buy Now" to reserve an item during a 10-minute payment checkout window',
      'Inventory count must NEVER oversell below zero under any concurrency condition',
      'If payment fails or timer expires, reserved inventory is automatically released back to stock',
    ],
    nonFunctional: [
      'Massive traffic surge: 500,000 concurrent checkout attempts at midnight spike',
      'Low latency: Reserve inventory response < 60ms P99',
      'Strict transactional consistency: ACID inventory updates',
      'High fault tolerance: Third-party payment gateway timeouts must not lock inventory indefinitely',
    ],
    dauEstimate: 85_000_000,
    readWriteRatio: '10:1 Read to Checkout Spike',
    targetP99Ms: 55,
    targetAvailabilitySla: 99.99,
    maxMonthlyBudgetUsd: 250_000,
  },
  keyConcepts: [
    'Virtual Waiting Room (Fair FIFO Queue) throttling ingress before hitting core checkout services',
    'In-Memory Atomic Inventory Decrement via Redis Lua Scripts (`DECRBY` with floor check)',
    'Optimistic Concurrency Control (OCC) with version numbers or distributed Redlock',
    'Two-Phase Inventory Reservation with automated TTL expiry via Redis Keyspace Notifications',
    'Idempotency Keys (UUID v4) on order creation preventing duplicate payment charges',
    'Circuit Breaker & Fallback Patterns wrapping external payment gateways',
  ],
  suggestedComponents: [
    'Cloudflare / Edge CDN Virtual Waiting Room Queue',
    'Token Bucket Rate Limiter at API Gateway tier',
    'Stateless Order Processing Microservice Fleet',
    'Redis Cluster with Lua Script Atomic Inventory Counters',
    'Kafka Async Order Fulfillment & Payment Event Stream',
    'ACID Relational Database (PostgreSQL) with Partitioned Order Ledgers',
  ],
  tradeOffs: [
    'Redis In-Memory Reservation vs. Database Row Lock (`SELECT FOR UPDATE`): Row-level DB locks cause catastrophic lock contention and connection pool exhaustion at 500k QPS; Redis atomic Lua handles 100k+ ops/sec in RAM.',
    'Pessimistic vs. Optimistic Locking: Optimistic locking causes 99% rollbacks under intense single-item contention; atomic in-memory pre-allocation eliminates rollback storms.',
    'Virtual Waiting Room vs. Raw Ingress: Queuing users protects downstream databases from cascading collapse.',
  ],
  targetSlaPercentage: 99.99,
};
