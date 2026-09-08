import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

interface TradeOffItem {
  id: string;
  scenarioId: ScenarioId;
  topic: string;
  optionA: {
    name: string;
    pros: string[];
    cons: string[];
    readLatency: string;
    writeLatency: string;
  };
  optionB: {
    name: string;
    pros: string[];
    cons: string[];
    readLatency: string;
    writeLatency: string;
  };
  staffRecommendation: string;
}

export const ARCHITECTURAL_TRADEOFFS: TradeOffItem[] = [
  {
    id: 'to-1',
    scenarioId: 'twitter-feed',
    topic: 'Timeline Fanout Strategy: Push vs Pull',
    optionA: {
      name: 'Fanout-on-Write (Push)',
      pros: ['Sub-15ms O(1) timeline read latency', 'Simple pre-computed timeline caches'],
      cons: ['Massive write amplification on celebrity tweets', 'Wasted compute for inactive users'],
      readLatency: '5 - 15 ms',
      writeLatency: '100 - 5000 ms',
    },
    optionB: {
      name: 'Fanout-on-Read (Pull)',
      pros: ['Zero write amplification', 'Instant post publishing'],
      cons: ['High read latency O(N) fetching all followees', 'DB thrashing on heavy reads'],
      readLatency: '120 - 450 ms',
      writeLatency: '2 - 5 ms',
    },
    staffRecommendation:
      'Hybrid: Push for standard users (<25k followers) to optimize 95% of reads; Pull & merge on-the-fly for celebrities.',
  },
  {
    id: 'to-2',
    scenarioId: 'uber-ride-matching',
    topic: 'Geospatial Indexing: Square Geohash vs Uber H3 Hexagons',
    optionA: {
      name: 'Geohash (Bounding Box)',
      pros: ['String prefix matching compatible with standard B-Trees', 'Widespread native DB support'],
      cons: ['Distortion at poles', 'Corner diagonal neighbors are further away than edge neighbors'],
      readLatency: '15 - 35 ms',
      writeLatency: '10 - 25 ms',
    },
    optionB: {
      name: 'Uber H3 Hexagonal Grid',
      pros: ['All 6 adjacent neighbors are equidistant', 'Constant-time k-ring radius expansion'],
      cons: ['Hierarchical hexagons cannot be perfectly subdivided without slight aperture skew'],
      readLatency: '4 - 12 ms',
      writeLatency: '2 - 6 ms',
    },
    staffRecommendation:
      'Use H3 Resolution 8 (~460m cell diameter) stored in Redis GEO. Eliminates distance distortion during dispatch searches.',
  },
  {
    id: 'to-3',
    scenarioId: 'black-friday-sale',
    topic: 'Inventory Concurrency: Pessimistic DB Lock vs Redis Lua',
    optionA: {
      name: 'Pessimistic Lock (SELECT FOR UPDATE)',
      pros: ['Strict ACID relational consistency', 'Native rollback semantics'],
      cons: ['Connection pool exhaustion', 'Severe transaction serialization and deadlocks at >500 QPS'],
      readLatency: '25 - 80 ms',
      writeLatency: '150 - 1200 ms',
    },
    optionB: {
      name: 'Atomic In-Memory Lua Script (Redis)',
      pros: ['100k+ QPS single-threaded execution', '100% oversell prevention at sub-5ms latency'],
      cons: ['Requires asynchronous write-behind reconciliation with primary database'],
      readLatency: '1 - 3 ms',
      writeLatency: '2 - 5 ms',
    },
    staffRecommendation:
      'Redis Lua script for real-time atomic inventory reservation; emit async order token into Kafka for checkout fulfillment.',
  },
  {
    id: 'to-4',
    scenarioId: 'netflix-streaming',
    topic: 'Video Delivery: Cloud Object Storage vs Edge CDN POPs',
    optionA: {
      name: 'Direct S3 / Object Storage',
      pros: ['Single centralized storage bucket', 'Immediate availability after upload'],
      cons: ['Astronomical egress costs (~$0.08/GB)', 'Global packet latency and frequent buffering'],
      readLatency: '120 - 450 ms',
      writeLatency: 'N/A (Read-Heavy)',
    },
    optionB: {
      name: 'Edge CDN (Open Connect Appliances)',
      pros: ['95%+ cache hit rate inside ISP networks', 'Zero video player rebuffering', '90% egress cost reduction'],
      cons: ['Cache warming required for new movie releases', 'Storage duplication across regional edge POPs'],
      readLatency: '8 - 25 ms',
      writeLatency: 'N/A (Read-Heavy)',
    },
    staffRecommendation:
      'Open Connect edge caches embedded directly in Tier-1 ISPs with Origin Shield architecture.',
  },
  {
    id: 'to-5',
    scenarioId: 'url-shortener',
    topic: 'ID Generation: Database Auto-Increment vs Snowflake 64-bit',
    optionA: {
      name: 'Relational DB Auto-Increment',
      pros: ['Guaranteed monotonic sequential ordering', 'Zero client configuration required'],
      cons: ['Centralized database write bottleneck', 'Vulnerable to competitor ID enumeration'],
      readLatency: '10 - 25 ms',
      writeLatency: '20 - 60 ms',
    },
    optionB: {
      name: 'Twitter Snowflake 64-bit',
      pros: ['Completely decentralized ID generation', 'Roughly time-ordered', 'Sub-millisecond generation'],
      cons: ['Requires NTP clock drift synchronization to prevent duplicate timestamps'],
      readLatency: '0 ms',
      writeLatency: '< 1 ms',
    },
    staffRecommendation:
      'Snowflake 64-bit encoded into Base62 7-character strings; yields 3.5 trillion URLs with no central coordination.',
  },
  {
    id: 'to-6',
    scenarioId: 'whatsapp-chat',
    topic: 'Connection Transport: HTTP Long-Polling vs WebSockets',
    optionA: {
      name: 'HTTP Long-Polling',
      pros: ['Simple stateless HTTP infrastructure', 'No sticky session proxy requirements'],
      cons: ['Massive HTTP header overhead per message', 'High mobile radio state churn & battery drain'],
      readLatency: '40 - 150 ms',
      writeLatency: '30 - 80 ms',
    },
    optionB: {
      name: 'Persistent WebSockets (TCP)',
      pros: ['Full-duplex real-time bi-directional streaming', 'Sub-20ms message delivery latency'],
      cons: ['Requires stateful gateway connection mapping (epoll/kqueue) and heartbeat pings'],
      readLatency: '5 - 15 ms',
      writeLatency: '5 - 15 ms',
    },
    staffRecommendation:
      'Persistent WebSockets with lightweight binary frame protocol and Redis user-to-gateway connection lookup table.',
  },
];

interface TradeoffMatrixViewProps {
  scenarioId?: ScenarioId;
}

export const TradeoffMatrixView: React.FC<TradeoffMatrixViewProps> = ({
  scenarioId,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | 'all'>(
    scenarioId ?? 'all'
  );

  const filteredTradeoffs =
    selectedScenario === 'all'
      ? ARCHITECTURAL_TRADEOFFS
      : ARCHITECTURAL_TRADEOFFS.filter((t) => t.scenarioId === selectedScenario);

  return (
    <div className="w-full rounded-2xl bg-[#1b263b] border border-[#415a77]/80 shadow-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#415a77]/60 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#e0e1dd]">
              Staff Engineering Architectural Trade-off Matrix
            </h3>
            <p className="text-xs text-[#778da9]">
              Every senior system design interview is fundamentally an evaluation of trade-offs, not perfect answers.
            </p>
          </div>
        </div>

        {/* Filter */}
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value as ScenarioId | 'all')}
          className="px-3 py-1.5 rounded-xl bg-[#0d1b2a] border border-[#415a77] text-xs font-mono text-[#e0e1dd] cursor-pointer"
        >
          <option value="all">All Scenarios ({ARCHITECTURAL_TRADEOFFS.length})</option>
          <option value="twitter-feed">Twitter Feed</option>
          <option value="uber-ride-matching">Uber Ride Matching</option>
          <option value="black-friday-sale">Black Friday Sale</option>
          <option value="netflix-streaming">Netflix Streaming</option>
          <option value="url-shortener">URL Shortener</option>
          <option value="whatsapp-chat">WhatsApp Chat</option>
        </select>
      </div>

      {/* Trade-off Cards */}
      <div className="space-y-6">
        {filteredTradeoffs.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-[#0d1b2a] border border-[#415a77]/60 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.scenarioId}
                </span>
                <h4 className="text-sm font-bold text-[#e0e1dd]">{item.topic}</h4>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A */}
              <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/40">
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {item.optionA.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#778da9]">
                    Read: {item.optionA.readLatency}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {item.optionA.pros.map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                  {item.optionA.cons.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-rose-300">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Option B */}
              <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/40">
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {item.optionB.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#778da9]">
                    Read: {item.optionB.readLatency}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {item.optionB.pros.map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                  {item.optionB.cons.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-rose-300">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation Strip */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 mr-1">STAFF VERDICT:</span>
                <span className="text-[#e0e1dd] leading-relaxed">
                  {item.staffRecommendation}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
