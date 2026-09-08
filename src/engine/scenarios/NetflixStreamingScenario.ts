/**
 * NetflixStreamingScenario — System Design Interview Scenario Specification
 * Problem: Design a Global Video Streaming Platform & Content Delivery Network (Netflix / YouTube)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const NETFLIX_STREAMING_SCENARIO: SystemDesignScenario = {
  id: 'netflix-streaming',
  title: 'Design Netflix Global Video Streaming CDN',
  subtitle: 'Adaptive Bitrate Streaming, Edge POP Appliances & Transcoding Fleet',
  category: 'streaming-media',
  difficulty: 'staff-level',
  iconName: 'Tv',
  summary:
    'Architect a planetary video distribution architecture delivering petabytes/sec of high-definition video, chunking content into adaptive bitrate segments (HLS/DASH), and steering requests across ISP edge appliances.',
  requirements: {
    functional: [
      'Users stream video with instant playback startup (< 1.5s time-to-first-frame)',
      'Adaptive Bitrate (ABR): Automatically adjust resolution (360p to 4K) based on live network bandwidth',
      'Upload and transcode raw master videos into dozens of codecs and resolution formats',
      'Track watch progress and resume playback across devices seamlessly',
    ],
    nonFunctional: [
      'Colossal egress bandwidth: 15+ Terabits/sec peak throughput',
      'High availability: 99.999% availability for playback manifest generation',
      'Low buffering ratio: < 0.2% video buffering time across all playback sessions',
      'Cost-optimized CDN egress via ISP co-location (Open Connect appliances)',
    ],
    dauEstimate: 260_000_000,
    readWriteRatio: '1000:1 Streaming Read Heavy',
    targetP99Ms: 25,
    targetAvailabilitySla: 99.999,
    maxMonthlyBudgetUsd: 450_000,
  },
  keyConcepts: [
    'HLS (HTTP Live Streaming) / MPEG-DASH 2-6 second segment chunking',
    'Adaptive Bitrate Algorithm (BBA / MPC) evaluating buffer occupancy and throughput',
    'Custom Edge CDN Appliances (Open Connect) embedded directly within Internet Service Provider (ISP) exchanges',
    'Distributed Asynchronous Video Transcoding Pipeline (Apache Spark / Worker Fleet)',
    'Dynamic Manifest Generator directing clients to the optimal edge POP based on real-time BGP telemetry',
    'Origin Shield Caching layer protecting central object storage (S3) from cache miss stampedes',
  ],
  suggestedComponents: [
    'Global Anycast Geo-DNS & Dynamic CDN Steering Service',
    'Distributed Edge POP Open Connect Storage Nodes',
    'API Gateway with JWT Session & Playback Rights Verification',
    'Distributed Document DB (Cassandra / DynamoDB) for user watch history and bookmarking',
    'Object Storage (AWS S3) for master archive and transcoded video chunk catalog',
    'Distributed Transcode Job Queue (Kafka + Celery/Kubernetes workers)',
  ],
  tradeOffs: [
    'Custom ISP Edge Appliances vs. Commercial Third-Party CDN: Custom hardware inside ISPs eliminates commercial transit costs and delivers sub-10ms chunk delivery.',
    'Pre-transcoding all formats vs. Just-In-Time (JIT) Transcoding: Pre-transcoding top 10% catalog saves CPU during peak streams; long-tail content transcoded on-demand.',
    'Dynamic Manifest Steering vs. Client-Side CDN Switching: Server-side steering coordinates aggregate ISP health globally to prevent oversubscribing single links.',
  ],
  targetSlaPercentage: 99.999,
};
