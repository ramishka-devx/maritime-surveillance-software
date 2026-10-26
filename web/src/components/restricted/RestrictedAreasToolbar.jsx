import React, { useState } from 'react';

export default function RestrictedAreasToolbar({ onSave, onCancel }) {
  const [activeTool, setActiveTool] = useState('select');
  const [isAdminMode, setIsAdminMode] = useState(true);

  const tools = [
    { id: 'select', icon: 'near_me', title: 'Select / Pan (V)' },
    { id: 'polygon', icon: 'polyline', title: 'Draw Polygon (P)' },
    { id: 'vertices', icon: 'adjust', title: 'Edit Vertices & Anchors (A)' },
    { id: 'buffer', icon: 'line_weight', title: 'Buffer Boundary (+/- 0.5 NM)' },
    { id: 'delete', icon: 'delete', title: 'Delete Selected Feature (Del)', isDanger: true },
  ];

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 font-sans select-none pointer-events-auto">

      {/* Drawing & Vector Editing Tools Strip */}
      <div className="flex items-center gap-2 p-1 bg-surface-container-low/95 border border-outline-variant/40 rounded shadow-xl backdrop-blur-md">
        <button
          onClick={onSave}
          className="px-2.5 py-1 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold uppercase transition-all flex items-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-[15px]">save</span>
          <span>Save</span>
        </button>

        <button
          onClick={onCancel}
          className="px-2 py-1 rounded hover:bg-surface-container text-outline hover:text-white font-mono text-xs transition-colors uppercase"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
