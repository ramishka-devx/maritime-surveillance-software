import React from 'react';

export default function HealthStatusCards({ metrics }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 font-sans select-none">
      {/* Card 1: Ingest Service */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between shadow-md border border-outline-variant/30 hover:bg-surface-container transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
            Ingest Service
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> OPERATIONAL
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              {metrics.ingestRate || '1,840'}
            </span>
            <span className="text-xs text-outline font-semibold">msg/s</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>WebSocket connected</span>
          </div>
        </div>

        <div className="pt-2 bg-surface-container-lowest/60 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl flex flex-col gap-0.5 font-mono text-[11px] border-t border-outline-variant/20">
          <span className="text-outline truncate">WSS // 4 Nodes Balanced</span>
          <span className="text-on-surface-variant font-medium">Peak: 2,120 msg/s</span>
        </div>
      </div>

      {/* Card 2: Kafka Broker */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between shadow-md border border-outline-variant/30 hover:bg-surface-container transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
            Kafka Broker
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-blue-400/30 text-blue-300 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" /> ELEVATED LAG
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl sm:text-2xl font-bold text-blue-300 tracking-tight">
              {metrics.kafkaLag || '120'}
            </span>
            <span className="text-xs text-blue-300 font-semibold">LAG COUNT</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-blue-300">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>Consumer delta +42</span>
          </div>
        </div>

        <div className="pt-2 bg-surface-container-lowest/60 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl flex flex-col gap-0.5 font-mono text-[11px] border-t border-outline-variant/20">
          <span className="text-outline truncate">Topic: ais.raw.telemetry</span>
          <span className="text-on-surface-variant font-medium">24 Partitions // 3/3 Sync</span>
        </div>
      </div>

      {/* Card 3: Analytic Engine */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between shadow-md border border-outline-variant/30 hover:bg-surface-container transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
            Analytic Engine
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ACTIVE
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              RUNNING
            </span>
            <span className="text-xs text-emerald-400 font-semibold">12s ago</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Inference loop 15s</span>
          </div>
        </div>

        <div className="pt-2 bg-surface-container-lowest/60 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl flex flex-col gap-0.5 font-mono text-[11px] border-t border-outline-variant/20">
          <span className="text-outline truncate">Models: 6/6 Active</span>
          <span className="text-on-surface-variant font-medium">Kinematic + Dark Vessel</span>
        </div>
      </div>

      {/* Card 4: PostgreSQL Database */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between shadow-md border border-outline-variant/30 hover:bg-surface-container transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
            PostgreSQL
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> OPTIMAL
          </span>
        </div>

        <div className="my-2 flex flex-col gap-1">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              34 <span className="text-outline text-xs font-normal">/ 100</span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold">34% Conns</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: '34%' }} />
          </div>
        </div>

        <div className="pt-2 bg-surface-container-lowest/60 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl flex flex-col gap-0.5 font-mono text-[11px] border-t border-outline-variant/20">
          <span className="text-outline truncate">Replica lag: 18ms</span>
          <span className="text-on-surface-variant font-medium">Cache hit: 99.4% (8 act)</span>
        </div>
      </div>

      {/* Card 5: Meta API Gateway */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between shadow-md border border-outline-variant/30 hover:bg-surface-container transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
            Meta API Gateway
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> NOMINAL
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              85 <span className="text-outline text-xs font-normal">ms</span>
            </span>
            <span className="text-xs text-cyan-400 font-semibold">p95 Latency</span>
          </div>
          <div className="flex items-center justify-between mt-1 font-mono text-xs text-on-surface-variant">
            <span>Error rate: <strong className="text-emerald-400">0.2%</strong></span>
            <span className="text-outline font-semibold">420 r/s</span>
          </div>
        </div>

        <div className="pt-2 bg-surface-container-lowest/60 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl flex flex-col gap-0.5 font-mono text-[11px] border-t border-outline-variant/20">
          <span className="text-outline truncate">TLS 1.3 // Mutual Auth</span>
          <span className="text-on-surface-variant font-medium">Edge: 12 PoPs Sync</span>
        </div>
      </div>
    </section>
  );
}
