import React, { useState } from 'react';

export default function BottomHud({
  cursorCoords = "07°52'23.2\"N 080°46'18.5\"E",
  depth = '42.5m CD',
  activeLayer = 'vector',
  onLayerChange,
  onZoomIn,
  onZoomOut,
  onResetBearing,
  currentZoom = 7,
}) {

  const layers = [
    { id: 'vector', label: 'Vector', icon: 'radar' },
    { id: 'satellite', label: 'Satellite', icon: 'satellite_alt' },
    { id: 'enc', label: 'ENC', icon: 'layers' },
  ];

  return (
    <footer className="fixed bottom-0 left-60 right-0 h-14 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/30 z-30 px-4 flex items-center justify-between gap-4 font-mono select-none">
      {/* Left: Map Layers & Basemap Selector */}
      <div className="flex items-center gap-1.5">
        {layers.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange && onLayerChange(layer.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-lowest text-outline hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{layer.icon}</span>
              <span className="hidden md:inline font-sans text-xs">{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Reticle Live Position & Navigation Zoom Tools */}
      <div className="flex items-center gap-4 text-xs">
        {/* Reticle Telemetry */}
        <div className="hidden sm:flex items-center gap-3 text-outline text-[11px]">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span>{cursorCoords}</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
          <button
            onClick={onZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            title="Zoom In (+)"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <button
            onClick={onZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            title="Zoom Out (-)"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <button
            onClick={onResetBearing}
            className="w-7 h-7 flex items-center justify-center rounded text-cyan-400 hover:text-cyan-300 hover:bg-surface-container transition-colors font-bold text-[11px] cursor-pointer active:scale-95"
            title="Reset to Initial View (North)"
          >
            N
          </button>
        </div>
      </div>
    </footer>
  );
}
