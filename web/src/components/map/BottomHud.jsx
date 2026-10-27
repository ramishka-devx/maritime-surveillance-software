import React from 'react';
import { Compass, Globe, Layers, Minus, Navigation, Plus } from 'lucide-react';

const layers = [
  { id: 'vector', label: 'Vector', icon: Compass },
  { id: 'satellite', label: 'Satellite', icon: Globe },
  { id: 'enc', label: 'ENC', icon: Layers },
];

const iconBtn =
  'w-9 h-9 grid place-items-center rounded-sm border border-bs-ink/[.16] hover:bg-bs-ink/[.07] outline-none focus-visible:outline-bs-accent';

export default function BottomHud({
  cursorCoords = '',
  activeLayer = 'vector',
  vesselCount = 0,
  flaggedCount = 0,
  onLayerChange,
  onZoomIn,
  onZoomOut,
  onResetBearing,
}) {
  return (
    <footer className="h-14 shrink-0 flex items-center gap-5 pl-6 pr-7 bg-bs-bg text-bs-ink select-none">
      {/* Basemap selector */}
      <div role="radiogroup" aria-label="Basemap" className="inline-flex border border-bs-ink/[.16] rounded-sm overflow-hidden">
        {layers.map(({ id, label, icon }) => {
          const Icon = icon;
          const on = activeLayer === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={on}
              onClick={() => onLayerChange?.(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-[7px] text-[13px] border-l border-bs-ink/[.16] first:border-l-0 outline-none focus-visible:outline-bs-accent focus-visible:-outline-offset-2 ${
                on ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
              }`}
            >
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <span className="hidden sm:inline text-[13px] italic text-bs-neutral-700 tabular-nums">
        {vesselCount.toLocaleString()} vessels in view · {flaggedCount} flagged
      </span>

      <span className="ml-auto hidden sm:inline text-[13px] font-mono tabular-nums">{cursorCoords}</span>

      <div className="flex gap-1">
        <button onClick={onZoomOut} className={iconBtn} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <button onClick={onZoomIn} className={iconBtn} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button onClick={onResetBearing} className={`${iconBtn} text-bs-accent-700`} aria-label="Reset to the home view">
          <Navigation size={16} />
        </button>
      </div>
    </footer>
  );
}
