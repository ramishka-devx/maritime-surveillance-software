import React from 'react';
import { btn, btnNeutral, btnPrimary, pageTitle } from '../ui/bs.js';

// Title, plus Discard / Save only while there are unsaved changes.
export default function RolesHeaderBar({ onDiscard, onSave, hasChanges = false, isSaving = false }) {
  return (
    <div className="flex flex-wrap items-center gap-4 min-h-[42px]">
      <h1 className={pageTitle}>Roles &amp; access</h1>
      {hasChanges && (
        <div className="ml-auto flex items-center gap-2.5">
          <span role="status" className="text-[13px] italic text-bs-accent-2-700">Unsaved changes</span>
          <button type="button" onClick={onDiscard} disabled={isSaving} className={`${btn} ${btnNeutral}`}>
            Discard
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className={`${btn} ${btnPrimary}`}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}
