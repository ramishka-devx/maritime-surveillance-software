import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import { Chip } from "./FilterChip.jsx";
import { InfoRow } from "./InfoRow.jsx";
import { LegendRow } from "./LegendRow.jsx";

export function MapPanel() {
  return (
    <RequestAccessGate
      permission="dashboard.map.view"
      featureName="Maritime Map"
    >
      <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Maritime Map
            </span>
            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Layers
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Zones
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Filters
            </button>
          </div>
        </div>

        <div className="relative h-[72vh] min-h-[520px] bg-[#0f1a2d]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:60px_60px]" />

          <div className="absolute left-4 top-4 w-[240px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Filters & Search
              </div>
              <button className="text-[10px] font-semibold text-[#9aa8c7] hover:text-white">
                Reset
              </button>
            </div>
            <input
              placeholder="Search MMSI / Vessel"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-[#7f8db3] outline-none focus:border-[#f28c1b]/60"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="All" active />
              <Chip label="Risk" />
              <Chip label="AIS Off" />
              <Chip label="Zone" />
            </div>
          </div>

          <div className="absolute bottom-4 left-4 w-[260px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                MV Ocean Star
              </div>
              <span className="rounded-md border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                Cargo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <InfoRow k="MMSI" v="563829104" />
              <InfoRow k="Speed" v="12.3 kn" />
              <InfoRow k="Course" v="SW 214°" />
              <InfoRow k="Status" v="Tracking" />
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
                Details
              </button>
              <button className="flex-1 rounded-lg bg-[#f28c1b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d97706]">
                Track
              </button>
            </div>
          </div>

          <div className="absolute right-4 top-4 w-[170px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
            <div className="mb-2 text-xs font-bold text-white">Legend</div>
            <LegendRow label="Normal" dot="bg-emerald-400" />
            <LegendRow label="Warning" dot="bg-yellow-400" />
            <LegendRow label="Critical" dot="bg-red-500" />
            <LegendRow label="Unknown" dot="bg-slate-400" />
          </div>
        </div>
      </div>
    </RequestAccessGate>
  );
}
