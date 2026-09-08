/**
 * WhatsAppChatScenario — System Design Interview Scenario Specification
 * Problem: Design a Globally Scalable Messaging Platform (WhatsApp / Discord)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const WHATSAPP_CHAT_SCENARIO: SystemDesignScenario = {
  id: 'whatsapp-chat',
  title: 'Design Scalable Real-Time Chat (WhatsApp)',
  subtitle: 'WebSocket Sessions, Offline Mailbox Spooling & Presence Heartbeats',
  category: 'real-time-chat',
  difficulty: 'hard',
  iconName: 'MessageSquare',
  summary:
    'Architect a globally distributed messaging platform supporting 2B users, 100B daily messages, persistent WebSocket connection managers, offline message queuing, and real-time presence heartbeat tracking.',
  requirements: {
    functional: [
      'Send and receive real-time 1:1 and group text messages with sub-second delivery',
      'Support message status acknowledgments: Sent (one check), Delivered (two checks), Read (blue checks)',
      'Store and deliver messages sent while recipient was offline immediately upon reconnection',
      'Display real-time user presence (Online / Last Seen) updated every 10-15 seconds',
    ],
    nonFunctional: [
      'Ultra-low latency: In-flight message transit < 20ms P99 between online users',
      'Massive concurrency: 50,000,000 concurrent persistent TCP/WebSocket connections',
      'High availability: 99.999% uptime for core message routing fabric',
      'Strict message ordering: Messages in a conversation must be rendered strictly in sequential order',
    ],
    dauEstimate: 500_000_000,
    readWriteRatio: '1:1 Balanced Message Exchange',
    targetP99Ms: 20,
    targetAvailabilitySla: 99.999,
    maxMonthlyBudgetUsd: 320_000,
  },
  keyConcepts: [
    'Stateful WebSocket Connection Managers with Redis Session Directory mapping UserID -> ServerID',
    'Offline Message Spooler (Kafka / RabbitMQ) holding pending messages until recipient reconnects',
    'Distributed Wide-Column Store (Apache Cassandra / ScyllaDB) partitioned by (ChatID, MessageID)',
    'Presence Servers tracking heartbeat pings via Redis In-Memory Hash with automatic key expiry',
    'Push Notification Service Gateway (APNs / FCM) triggered for offline users',
    'End-to-End Encryption (Signal Protocol / Double Ratchet) ensuring server is a zero-knowledge router',
  ],
  suggestedComponents: [
    'Layer 4 Load Balancer routing TCP/TLS WebSocket traffic',
    'WebSocket Gateway Connection Fleet (Erlang / Go / Netty)',
    'User Session Registry Cluster (Redis Cluster)',
    'Message Router & Group Fanout Microservice',
    'Distributed Message Store (Cassandra / ScyllaDB) with SSD log-structured storage',
    'Distributed Presence Heartbeat Cluster',
  ],
  tradeOffs: [
    'Cassandra vs. Relational SQL: Cassandra LSM-trees handle 1M+ writes/sec sequentially to commit logs without B-tree lock contention; perfectly partitioned by conversation thread.',
    'Presence Broadcast vs. Lazy Pull: Broadcasting presence to all contacts causes O(N^2) traffic explosion; lazy querying on active chat screen saves 95% bandwidth.',
    'Message Ordering via Distributed Snowflake vs. Per-Chat Sequence Counter: Snowflake timestamp guarantees monotonic ordering across distributed gateway nodes.',
  ],
  targetSlaPercentage: 99.999,
};
