# Distributed Systems Simulator

A browser-native, high-scale distributed architecture simulation, queuing, failure injection, and FAANG system design interview evaluation sandbox built with React 18, TypeScript, and TailwindCSS.

![Phase Status](https://img.shields.io/badge/Phases-12%2F12%20Complete-emerald)
![Tests](https://img.shields.io/badge/Tests-81%20Passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## 🌟 Overview

The **Distributed Systems Simulator** is an interactive, enterprise-grade engineering sandbox designed to simulate real-world high-throughput microservices, database clusters, distributed caches, event-driven message queues, and global multi-region networks.

It features a dedicated **Staff Engineer System Design Interview Sandbox (Phase 12)** that lets software engineers, tech leads, and principal architects practice canonical FAANG system design interviews with:
- **Interactive Napkin-Math Workload Calculators** (Read/Write QPS, 5-year storage, bandwidth, 80/20 RAM cache sizing, and MVP-to-FAANG scale presets).
- **Domain-Specific Real-Time Traffic Simulators** (Twitter hybrid push/pull fanout, Uber H3 spatial indexing, Black Friday atomic Lua token reservation, Netflix adaptive bitrate chunking, Bitly Base62 distributed counter allocation, and WhatsApp Erlang/BEAM WebSocket connection managers).
- **Automated Architecture Evaluators** (Scoring availability SLAs, P99 latency budgets, cloud costs, and automated Single Point of Failure [SPOF] detection with letter grades A+ through F).
- **Pre-Configured Architecture Blueprints** (Side-by-side comparison of naive single-node baseline vs. fault-tolerant production architectures with ASCII and topological flowcharts).
- **Real-World Incident Post-Mortems** (Deep root-cause analyses of famous industry outages: Twitter 2010 World Cup Fail Whale, Uber NYE Surge Lockouts, AWS US-East-1 Netflix Outages, Black Friday Flash Sale deadlocks, and WhatsApp New Year connection tsunamis).
- **Staff Engineer Knowledge Quizzes** (18 multi-choice technical quiz questions with detailed architectural explanations).
- **Automated Stress Benchmarks** (Simulated high-concurrency traffic bursts measuring P50, P90, P95, and P99 latency percentiles).
- **Executive Markdown Dossier Exporter** (Export full interview assessment records with letter grades, metrics, SPOF remediations, and napkin-math figures).

---

## 🗺️ Complete 12-Phase Roadmap Status (100% Complete)

| Phase | Subsystem / Capability | Status | Highlights |
|---|---|:---:|---|
| **Phase 1** | **Core Simulation Engine & Worker Architecture** | ✅ Complete | Discrete-event tick loop, immutable state transitions, Web Worker offloading |
| **Phase 2** | **Topology Canvas & Component Visualization** | ✅ Complete | Canvas drag-and-drop, node links, packet animations, health status indicators |
| **Phase 3** | **Traffic Generation & Workload Patterns** | ✅ Complete | Poisson bursts, diurnal traffic curves, spike injections, synthetic clients |
| **Phase 4** | **Database Replication & Distributed Storage** | ✅ Complete | Leader-follower sync/async replication, WAL replication lag, failover elections |
| **Phase 5** | **Tiered Caching & Invalidation Strategies** | ✅ Complete | Redis clusters, LRU eviction, Write-Through, Write-Back, Cache-Aside |
| **Phase 6** | **Resilience Patterns & Circuit Breakers** | ✅ Complete | Token bucket rate limiters, Envoy-style circuit breakers, exponential jitter |
| **Phase 7** | **Chaos Engineering & Failure Monkey** | ✅ Complete | Network partitions, latency injection, packet drops, node kill drills |
| **Phase 8** | **Observability, Metrics & Telemetry** | ✅ Complete | Real-time RPS graphs, P50/P90/P99 latency histograms, CPU/RAM monitoring |
| **Phase 9** | **Multi-Region Active-Active Consensus** | ✅ Complete | Multi-datacenter routing, cross-region replication, Quorum consistency |
| **Phase 10** | **Scenario Challenges & Incident Drills** | ✅ Complete | Interactive drill challenges, timed incident response, automated grading |
| **Phase 11** | **Post-Mortem Dossiers & RCA Exporter** | ✅ Complete | Production incident reports, timeline generator, PDF/Markdown export |
| **Phase 12** | **System Design Interview Engine & Architecture Sandbox** | ✅ Complete | 6 FAANG scenarios, napkin math, live traffic simulators, blueprints, quizzes |

---

## 🏛️ Phase 12 System Design Scenarios Matrix

| Scenario | Tier | Target SLA | Primary Architectural Trade-off & Solution |
|---|:---:|:---:|---|
| **1. Twitter / X Newsfeed** | Hard | 99.99% (P99 < 95ms) | **Celebrity Fanout Amplification:** Hybrid Push/Pull fanout. Normal users (<25k) fan out on write to Redis; celebrities (>25k) pull and merge on read. |
| **2. Uber Ride Matching** | Staff | 99.95% (P99 < 80ms) | **Spatial Hotspotting & Lock Contention:** Uber H3 hexagonal spatial indexing, discrete 5-second match windows with Hungarian algorithm, in-memory GPS caching. |
| **3. Black Friday Flash Sale** | Hard | 99.99% (P99 < 60ms) | **Inventory Overselling & DB Deadlocks:** Redis atomic Lua reservation script (`DECRBY` with check), virtual waiting room, asynchronous Kafka payment settlement. |
| **4. Netflix Video Streaming** | Medium | 99.99% (P99 < 45ms) | **High-Throughput Origin Saturation:** Multi-CDN edge appliances (Open Connect) caching 98% of 4-second ABR video chunks; multi-region active-active control plane. |
| **5. Bitly URL Shortener** | Easy | 99.99% (P99 < 15ms) | **Hash Collisions & Read Stampedes:** Deterministic distributed Base62 counter IDs (62^7 = 3.5T keys), in-memory Bloom filters, HTTP 301 edge caching. |
| **6. WhatsApp Real-Time Chat** | Staff | 99.99% (P99 < 70ms) | **C10M Persistent Connections:** Erlang/BEAM lightweight processes (2M conns/server), ephemeral connection edge, dual-ACK state machine, Cassandra append-only log. |

---

## 📐 Architecture Topology & Data Flow (Phase 12 Engine)

```
                       ┌──────────────────────────────────────────────────────────┐
                       │           System Design Interview Sandbox                │
                       └────────────────────────────┬─────────────────────────────┘
                                                    │
         ┌───────────────────┬──────────────────────┼──────────────────────┬───────────────────┐
         ▼                   ▼                      ▼                      ▼                   ▼
┌──────────────────┐ ┌────────────────┐ ┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────┐
│ Capacity Estimator│ │Scenario Catalog│ │ Architecture Presets │ │  Live Simulators  │ │ Scorecard Evaluator│
│  & Scale Presets │ │  (6 Scenarios) │ │ (Naive vs Production)│ │ (6 Domain Engines)│ │ (SLA / SPOF / Cost)│
└──────────────────┘ └────────────────┘ └──────────────────────┘ └───────────────────┘ └──────────────────┘
         │                   │                      │                      │                   │
         └───────────────────┴──────────────────────┼──────────────────────┴───────────────────┘
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │  System Design Report Exporter (Dossier) │
                               └─────────────────────────────────────────┘
```

---

## 🧪 Comprehensive Automated Test Suites

The test suite is powered by **Vitest 5.0.0** and executes in under 2 seconds:

```bash
npm test
```

### Test Coverage Highlights (22 Test Suites, 81 Tests Passing):
- `src/test/interview/FullInterviewLifecycle.test.ts` — Complete end-to-end candidate journey validation.
- `src/test/interview/ScenarioCatalog.test.ts` — Scenario metadata, SLA requirements, and difficulty tiers.
- `src/test/interview/CapacityEstimator.test.ts` — Back-of-the-envelope math calculations (QPS, storage, bandwidth, RAM cache).
- `src/test/interview/CapacityPresetProfiles.test.ts` — Scale profiles from MVP Startup (100k DAU) to FAANG Scale (300M+ DAU).
- `src/test/interview/ArchitectureEvaluator.test.ts` — Multi-pillar grading engine, SLA verification, and SPOF detection.
- `src/test/interview/ArchitecturePresets.test.ts` — Baseline naive vs. production high-scale preset blueprints.
- `src/test/interview/ArchitectureBlueprintViewer.test.ts` — ASCII topology diagrams, data flow steps, and network protocols.
- `src/test/interview/FailureModeMatrix.test.ts` — Historical production incident post-mortems and root-cause analyses.
- `src/test/interview/SystemDesignQuizQuestions.test.ts` — 18 technical quiz questions and explanations.
- `src/test/interview/ScenarioBenchmarkRunner.test.ts` — Automated burst load benchmarks and latency percentile checks.
- `src/test/interview/SystemDesignReportExporter.test.ts` — Executive Markdown dossier generation.
- `src/test/interview/TwitterFanoutSimulator.test.ts` — Hybrid push/pull timeline fanout.
- `src/test/interview/UberGeohashSimulator.test.ts` — H3 hexagonal spatial indexing and surge pricing.
- `src/test/interview/BlackFridayInventorySimulator.test.ts` — Atomic Lua inventory reservation and token buckets.
- `src/test/interview/NetflixStreamingSimulator.test.ts` — Adaptive bitrate chunking and CDN edge cache hits.
- `src/test/interview/UrlShortenerSimulator.test.ts` — Base62 range encoding and Bloom filter existence checks.
- `src/test/interview/WhatsAppMessagingSimulator.test.ts` — WebSocket connection managers and dual-ACK state machine.
- `src/test/interview/InterviewHintsEngine.test.ts` — 3-tier progressive hints and score penalties.
- `src/test/interview/TradeoffMatrix.test.ts` — Architectural tradeoff comparisons and staff recommendations.
- `src/test/interview/ScenarioChallengeRunner.test.ts` — 6-step interview progression and checklist orchestrator.
- `src/test/interview/ScenarioSimulatorFactory.test.ts` — Domain simulator factory registry.
- `src/test/interview/EngineScenarioIntegration.test.ts` — Engine-to-simulation state integration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/Humaam-04-06/Distributed_Systems_Simulator.git
cd Distributed_Systems_Simulator
npm install
```

### Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests
```bash
npm test
```

### Type Checking & Production Build
```bash
npx tsc --noEmit
npm run build
```

---

## 🎨 Design Aesthetic & Palette

The user interface adheres to a curated **Deep Space Navy** palette:
- **Background**: `#0d1b2a`
- **Surface / Card**: `#1b263b`
- **Borders & Dividers**: `#415a77`
- **Muted Text / Metadata**: `#778da9`
- **High-Contrast Typography**: `#e0e1dd`
- **Alerts & Modals**: Exclusively powered by **SweetAlert2** with custom dark theme styling.

---

## 📄 License

MIT License. Built for distributed systems engineers and system design interview preparation.
