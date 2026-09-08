# 🌐 Distributed Systems Simulator

> **A browser-native, high-scale distributed systems architecture, queuing models, failure injection, and FAANG system design interview evaluation sandbox.**

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-5.0-FCC72B?style=flat-square&logo=vitest&logoColor=black)](https://vitest.dev/)
[![Phases](https://img.shields.io/badge/Roadmap-12%2F12%20Phases%20Complete-10B981?style=flat-square)](#-project-roadmap-status)
[![Tests](https://img.shields.io/badge/Tests-81%2F81%20Passing-brightgreen?style=flat-square)](#-testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Design Interview Sandbox (Phase 12)](#-system-design-interview-sandbox-phase-12)
  - [Canonical FAANG Scenarios](#canonical-faang-scenarios)
  - [Interactive Capabilities](#interactive-capabilities)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Setup](#-getting-started--setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Testing](#-testing)
- [Production Build](#-production-build)
- [Release Guide](#-release-guide)
  - [1. GitHub Release & Git Tagging](#1-github-release--git-tagging)
  - [2. Deploying to Vercel / Netlify / GitHub Pages](#2-deploying-to-vercel--netlify--github-pages)
- [Complete 12-Phase Roadmap](#-complete-12-phase-roadmap)
- [Design Aesthetics](#-design-aesthetics)
- [Author & License](#-author--license)

---

## 💡 Overview

The **Distributed Systems Simulator** provides a visual, hands-on environment for modeling, testing, and debugging high-throughput distributed architectures. Rather than reading abstract documentation, engineers can interactively observe:
- Traffic distribution and consistent hashing on load balancers.
- Primary-replica database replication lag and failover split-brain scenarios.
- Multi-tier cache stampedes, XFetch early recomputation, and LRU/LFU evictions.
- Circuit breaker tripping, token-bucket rate limiting, and exponential retry backoff with jitter.
- Multi-region geo-routing across trans-oceanic subsea fiber backbones.
- Chaos engineering experiments (node crashes, packet drops, Byzantine traitors).
- End-to-end **System Design Interviews** with napkin-math calculators, automated SLA scoring, and real-world outage post-mortems.

---

## ⚡ Key Features

### 1. Ingress & Load Balancing
- **Load Balancing Algorithms**: Round Robin, Least Connections, Weighted Round Robin, and Deterministic IP Hash.
- **Consistent Hashing Ring**: 360-degree interactive SVG visualizer with virtual node tokens and minimal key redistribution upon node failure.
- **Token Bucket Rate Limiting**: Ingress traffic throttling with configurable burst capacity and continuous token refill.
- **Health Checks & Outlier Ejection**: Automated outlier detection with consecutive error threshold tripping.

### 2. Compute Nodes & Bulkheads
- **Server Cluster Grid**: Horizontal scaling from 1 to 6 nodes with dynamic CPU, memory, and active connection tracking.
- **Failure State Machine**: Simulates healthy, degraded, flapping, and out-of-memory (OOM) node states.
- **Bulkhead Isolation**: Independent thread and connection pools for critical vs. non-critical subsystems.
- **Automated Watchdog Supervisor**: Process health supervision with automatic node restart and recovery.

### 3. Distributed Database & Storage
- **Primary-Replica Replication**: Synchronous and asynchronous write-ahead log (WAL) streaming.
- **Replication Lag & LSN Tracking**: Simulates replication lag in milliseconds and Log Sequence Numbers (LSN).
- **Automated Quorum Failover**: Automatic promotion of the freshest replica during leader outages.
- **Split-Brain Mitigation**: STONITH (Shoot The Other Node In The Head) fencing and dual-leader detection.

### 4. Tiered Caching & Invalidation
- **Redis Cluster Simulation**: In-memory key-value cache with real-time hit/miss ratio tracking.
- **Eviction Policies**: Least Recently Used (LRU), Least Frequently Used (LFU), and First-In-First-Out (FIFO).
- **Cache Stampede Defense**: Mutex single-flight request coalescing and XFetch probabilistic early recomputation.
- **Key Inspector**: Detailed inspection of cache keys, TTL countdowns, and manual purge triggers.

### 5. Resilience & Fault Tolerance
- **Envoy/Hystrix Circuit Breakers**: Closed, Open, and Half-Open tri-state machines with automatic health probing.
- **Advanced Retry Jitter**: AWS Full Jitter and Decorrelated Jitter algorithms with idempotency safeguards.
- **Graceful Degradation Fallbacks**: Stale cache fallback, mock default responses, and read-only mode.

### 6. Chaos Engineering & Byzantine Faults
- **Network Partition Matrix**: Simulates full network cuts, asymmetric rings, and cross-AZ partitions.
- **Byzantine Fault Injection**: Simulates Lamport's Byzantine Generals problem with message bit-flips and vote tampering.
- **Chaos Monkey Experiment Runner**: Automated automated drills (*Rolling AZ Outage*, *Database Blackhole*, *Cascading Meltdown*).

### 7. Global Multi-Region & Geo-DNS
- **Geo-DNS Routing Policies**: Geo-Proximity (Haversine distance), Latency-Based, Weighted, Active-Passive, and BGP Anycast.
- **Subsea Fiber WAN Backbone**: Physical simulation of major undersea cables with propagation delay and cut drills.
- **1-Click Region Evacuation**: Instantaneous traffic draining and automated leader re-election.

---

## 🎓 System Design Interview Sandbox (Phase 12)

Phase 12 turns the simulator into an interactive interview preparation and architecture sandbox for senior and staff engineer candidates.

### Canonical FAANG Scenarios

| Scenario | Tier | Target SLA | Core Architectural Challenge & Solution |
|---|:---:|:---:|---|
| **Twitter / X Newsfeed** | Hard | 99.99% (P99 < 95ms) | **Celebrity Fan-out:** Hybrid push/pull fan-out. Normal users write to Redis; celebrities pull on read. |
| **Uber Ride Matching** | Staff | 99.95% (P99 < 80ms) | **Spatial Contention:** Uber H3 hexagonal spatial indexing, discrete 5-second match windows with Hungarian algorithm. |
| **Black Friday Flash Sale** | Hard | 99.99% (P99 < 60ms) | **Inventory Overselling:** Atomic Redis Lua script reservations, virtual waiting room, asynchronous Kafka checkout. |
| **Netflix Video Streaming** | Medium | 99.99% (P99 < 45ms) | **Origin I/O Bottlenecks:** Multi-CDN edge appliances (Open Connect) caching 98% of 4s ABR chunks; multi-region active-active. |
| **Bitly URL Shortener** | Easy | 99.99% (P99 < 15ms) | **Hash Collisions:** Deterministic Base62 counter IDs (3.5T unique links), Bloom filters, HTTP 301 edge caching. |
| **WhatsApp Chat Platform** | Staff | 99.99% (P99 < 70ms) | **C10M Connections:** Erlang/BEAM lightweight processes (2M conns/server), ephemeral gateways, dual-ACK state machine. |

### Interactive Capabilities

- **🧮 Napkin-Math Capacity Estimator**: Back-of-the-envelope calculations for read/write QPS, 5-year storage, bandwidth, and 80/20 RAM cache sizing across 4 scale profiles (*MVP Startup*, *Series B*, *FAANG Scale*, *Viral Flash Spikes*).
- **🏆 Automated Architecture Evaluator**: Grades candidate architectures from **A+ to F** based on measured availability, P99 latency budgets, cloud costs, and Single Points of Failure (SPOFs).
- **🧭 6-Step Interview State Machine**: Guides candidates through *Clarification*, *Estimation*, *High-Level Design*, *Deep Dive*, *Failure Scenarios*, and *Final Review*.
- **💡 3-Tier Progressive Hints Engine**: Gentle nudges, architectural recommendations, and canonical blueprints with score penalties.
- **🗺️ Topology Blueprints**: ASCII flowcharts and data flow pipelines contrasting naive baselines with production designs.
- **💥 Historical Post-Mortems (FailureModeMatrix)**: Real-world outage analyses (Twitter Fail Whale, Uber NYE Surge, Netflix AWS US-East-1 outage, WhatsApp connection tsunami).
- **📝 Staff Engineer Technical Quizzes**: 18 deep-dive questions with detailed explanations.
- **⚡ Automated Load Benchmarks**: Simulated traffic bursts up to 10,000 QPS with statistical percentile verification.
- **📄 Executive Markdown Dossier Exporter**: Generates complete technical evaluation reports with scorecards and recommendations.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [TailwindCSS 3.4](https://tailwindcss.com/) with a curated **Deep Space Navy** theme
- **Icons**: [Lucide React](https://lucide.dev/)
- **Modals & Dialogs**: [SweetAlert2](https://sweetalert2.github.io/) with custom dark styling
- **Testing**: [Vitest 5.0](https://vitest.dev/)

---

## 📂 Project Directory Structure

```text
Distributed_Systems_Simulator/
├── src/
│   ├── components/                 # React UI components
│   │   ├── bulkhead/              # Bulkhead thread & connection pool UI
│   │   ├── chaos/                 # Chaos monkey, partitions & Byzantine UI
│   │   ├── interview/             # System Design Interview Sandbox UI
│   │   │   ├── ArchitectureBlueprintModal.tsx
│   │   │   ├── ArchitecturePresetLoader.tsx
│   │   │   ├── ArchitectureScorecardModal.tsx
│   │   │   ├── CapacityEstimatorCalculator.tsx
│   │   │   ├── FailureModeCaseStudyModal.tsx
│   │   │   ├── InterviewHintWidget.tsx
│   │   │   ├── ScenarioBenchmarkModal.tsx
│   │   │   ├── ScenarioSimulationWidget.tsx
│   │   │   ├── SystemDesignObjectivePanel.tsx
│   │   │   ├── SystemDesignQuizModal.tsx
│   │   │   ├── SystemDesignSandboxView.tsx
│   │   │   └── TradeoffMatrixView.tsx
│   │   ├── layout/                # Header, navigation, status bar
│   │   ├── modals/                # Consistent hash ring, circuit breaker modals
│   │   ├── multiregion/           # Multi-region world map & Geo-DNS UI
│   │   ├── nodes/                 # Server cards, DB cards, cluster grid
│   │   ├── telemetry/             # Metrics charts, latency histograms
│   │   └── ui/                    # Base primitives (Button, Badge, Card, Slider)
│   ├── engine/                    # Core simulation engines
│   │   ├── scenarios/             # System design scenario specifications & engines
│   │   │   ├── simulators/        # Domain simulators (Twitter, Uber, Netflix, etc.)
│   │   │   ├── ArchitectureBlueprintViewer.ts
│   │   │   ├── ArchitectureEvaluator.ts
│   │   │   ├── ArchitecturePresets.ts
│   │   │   ├── CapacityEstimator.ts
│   │   │   ├── CapacityPresetProfiles.ts
│   │   │   ├── FailureModeMatrix.ts
│   │   │   ├── InterviewHintsEngine.ts
│   │   │   ├── ScenarioBenchmarkRunner.ts
│   │   │   ├── ScenarioCatalog.ts
│   │   │   ├── ScenarioChallengeRunner.ts
│   │   │   └── SystemDesignQuizQuestions.ts
│   │   ├── ByzantineFaultInjector.ts
│   │   ├── CacheEvictionEngine.ts
│   │   ├── CircuitBreakerManager.ts
│   │   ├── ConsistentHashRing.ts
│   │   ├── DatabaseReplicationEngine.ts
│   │   ├── GeoDnsRouter.ts
│   │   ├── LoadBalancerEngine.ts
│   │   ├── MultiRegionLatencyEngine.ts
│   │   ├── NetworkPartitionMatrix.ts
│   │   ├── SimulationEngine.ts
│   │   └── types.ts
│   ├── hooks/                     # Custom React hooks (useSimulation)
│   ├── test/                      # Vitest test suites (22 suites, 81 tests)
│   │   └── interview/             # Comprehensive scenario & engine tests
│   ├── utils/                     # Alert helpers & formatting
│   ├── App.tsx                    # Main multi-tab application container
│   ├── index.css                  # Global Tailwind styles & dark scrollbars
│   └── main.tsx                   # Application entry point
├── dist/                          # Production build output
├── LICENSE                        # MIT License
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript compiler options
├── vite.config.ts                 # Vite bundler configuration
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started & Setup

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Humaam-04-06/Distributed_Systems_Simulator.git
   cd Distributed_Systems_Simulator
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

### Running Locally

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:5173
```

You can now interact with all 10 simulation tabs:
1. **Topology Canvas**: Drag, drop, and link nodes.
2. **Load Balancer**: Consistent hashing ring and routing algorithms.
3. **Server Cluster**: Horizontal scaling and node failures.
4. **Database Storage**: Primary-replica replication and failover elections.
5. **Caching Tier**: LRU/LFU eviction and cache stampede simulations.
6. **Resilience & Breakers**: Circuit breaker state transitions and retry jitter.
7. **Bulkhead Isolation**: Thread and connection pool boundaries.
8. **Chaos Lab**: Network partitions and Byzantine fault injection.
9. **Multi-Region & Geo-DNS**: Global subsea cable map and disaster drills.
10. **System Design Interview Sandbox**: FAANG scenario challenges, napkin math, and architecture grading.

---

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for unit and integration testing.

Run the test suite:
```bash
npm test
```

Run tests in watch mode (interactive development):
```bash
npm run test:watch
```

### Test Suite Status
```text
Test Files  22 passed (22)
     Tests  81 passed (81)
  Duration  ~1.7s
```

All 22 test suites pass with 100% success rate, including the end-to-end integration test (`FullInterviewLifecycle.test.ts`).

---

## 📦 Production Build

To verify TypeScript types and generate the optimized production bundle:

```bash
# Type check without emitting files
npx tsc --noEmit

# Build for production
npm run build
```

The optimized assets will be generated in the `dist/` directory, ready to be served by any static web server or CDN.

To preview the production build locally:
```bash
npm run preview
```

---

## 🚢 Release Guide

### 1. GitHub Release & Git Tagging

To publish a formal release on GitHub:

```bash
# 1. Ensure you are on main and all changes are committed
git checkout main
git pull origin main

# 2. Create an annotated git release tag
git tag -a v1.0.0 -m "Release v1.0.0: Distributed Systems & System Design Interview Simulator"

# 3. Push the tag to GitHub
git push origin v1.0.0
```

#### Creating the GitHub Release via Web UI:
1. Go to your repository on GitHub: `https://github.com/Humaam-04-06/Distributed_Systems_Simulator/releases`.
2. Click **Draft a new release**.
3. Choose the tag `v1.0.0`.
4. Set Release Title: **v1.0.0 — Production Release: Complete 12-Phase Distributed Architecture Simulator**.
5. Paste the release notes highlighting the 12 phases, 81 tests, and System Design Sandbox.
6. Click **Publish release**.

---

### 2. Deploying to Vercel / Netlify / GitHub Pages

#### Option A: Deploy to Vercel (Recommended — 1-Click)
1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import the `Distributed_Systems_Simulator` repository.
3. Keep default settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Your app will be live at `https://distributed-systems-simulator.vercel.app`.

#### Option B: Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com/) and link your repository.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy**.

#### Option C: Deploy to GitHub Pages
1. Install `gh-pages`: `npm install -D gh-pages`
2. Add `"deploy": "gh-pages -d dist"` to `package.json`.
3. Run `npm run build && npm run deploy`.

---

## 🗺️ Complete 12-Phase Roadmap

| Phase | Milestone Name | Status | Key Deliverables |
|:---:|---|:---:|---|
| **Phase 1** | Project Scaffold & UI Primitives | ✅ Complete | Tailwind design tokens, Buttons, Badges, Sliders, Header |
| **Phase 2** | Discrete Simulation Engine & Telemetry | ✅ Complete | Discrete clock, M/M/1 queuing, sliding-window latency percentiles |
| **Phase 3** | Load Balancing & Consistent Hashing | ✅ Complete | Round Robin, Least Conn, 360° Consistent Hash Ring SVG |
| **Phase 4** | Compute Cluster & Resource Pressure | ✅ Complete | CPU/RAM models, thread pool limits, watchdog supervisor |
| **Phase 5** | Database Replication & Failover | ✅ Complete | Sync/Async WAL streaming, replication lag, split-brain STONITH |
| **Phase 6** | Tiered Caching & Eviction Policies | ✅ Complete | Redis cluster, LRU/LFU/FIFO, XFetch stampede defense |
| **Phase 7** | Circuit Breakers & Retry Jitter | ✅ Complete | Hystrix state machine, AWS Full Jitter, fallback degradation |
| **Phase 8** | Bulkhead Pattern Isolation | ✅ Complete | Thread pool and connection pool bulkheads with queue backpressure |
| **Phase 9** | Observability & Metrics Dashboard | ✅ Complete | P50/P90/P99 latency histograms, live RPS charts, alert feeds |
| **Phase 10** | Chaos Lab, Partitions & Byzantine Faults | ✅ Complete | Network partition matrix, Lamport Byzantine traitors, Chaos drills |
| **Phase 11** | Multi-Region Active-Active & Geo-DNS | ✅ Complete | Geo-Proximity, subsea cable physical WAN, 1-click evacuation |
| **Phase 12** | System Design Interview Sandbox | ✅ Complete | 6 FAANG scenarios, napkin math, architecture evaluator, quizzes |

---

## 🎨 Design Aesthetics

The user interface follows a curated **Deep Space Navy** dark palette designed for extended engineering sessions:
- **Primary Background**: `#0d1b2a`
- **Surface / Card Background**: `#1b263b`
- **Borders & Dividers**: `#415a77`
- **Muted Metadata & Labels**: `#778da9`
- **High-Contrast Text**: `#e0e1dd`
- **Dialogs & Notifications**: Styled exclusively using **SweetAlert2** with custom theme tokens.

---

## 👤 Author & License

- **Author**: Humaam Ahmed ([@Humaam-04-06](https://github.com/Humaam-04-06))
- **Email**: humaamahmed40@gmail.com
- **License**: Released under the [MIT License](LICENSE). Free to use, modify, and distribute for educational, commercial, and interview preparation purposes.
