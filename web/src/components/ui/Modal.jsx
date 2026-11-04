import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { focusRing } from './bs.js';

// Broadsheet dialog (same look as the Restricted areas one). Portalled to <body> so the
// backdrop covers the sidebar and header too. Esc or a backdrop click closes unless `busy`.
export default function Modal({ title, subtitle, onClose, busy = false, footer, children, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-5 bg-bs-neutral-800/50"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ width: `min(${width}px, 100%)` }}
        className="max-h-[85vh] flex flex-col bg-bs-bg text-bs-ink font-sans shadow-bs-lg rounded-[4px]"
      >
        <div className="px-6 pt-5 pb-3 flex items-start gap-3">
          <div className="flex-1">
            <h2 id="modal-title" className="text-[20px] font-semibold">{title}</h2>
            {subtitle && <p className="text-[13px] italic text-bs-neutral-700">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className={`w-8 h-8 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-2 overflow-y-auto scroll-thin flex flex-col gap-4">{children}</div>
        {footer && <div className="px-6 py-4 mt-2 flex items-center gap-2.5 border-t border-bs-ink/[.08]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
