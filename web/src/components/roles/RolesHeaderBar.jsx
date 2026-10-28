import React from 'react';

export default function RolesHeaderBar({
  onDiscard,
  onSave,
  hasChanges = false,
  isSaving = false,
  affectedUsersCount = 0,
}) {
  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 select-none font-sans">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-3 mt-0.5">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">
            Roles &amp; Permissions
          </h1>
          
        </div>
      </div>

      {/* Header Alert & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end font-mono text-xs">
        {/* Live Warning Pill */}
        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-amber-50 border border-amber-300 text-amber-800 shadow-xs animate-pulse">
            <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
            <span className="font-medium text-[11px]">
              Unsaved changes affect <span className="font-bold underline decoration-amber-500">{affectedUsersCount} {affectedUsersCount === 1 ? 'user' : 'users'}</span>
            </span>
          </div>
        )}

        {/* Discard Action */}
        <button
          type="button"
          onClick={onDiscard}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all uppercase tracking-wider ${
            !hasChanges || isSaving
              ? 'opacity-40 cursor-not-allowed text-slate-400 bg-white border-slate-200'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer shadow-xs'
          }`}
          title={hasChanges ? 'Reset matrix changes back to server baseline' : 'No changes to discard'}
        >
          <span className="material-symbols-outlined text-[16px] text-slate-400">restart_alt</span>
          <span>Discard</span>
        </button>

        {/* Save Action */}
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-sm font-bold uppercase tracking-wider transition-all ${
            !hasChanges || isSaving
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
              : 'bg-[#0891b2] text-white hover:bg-[#0e7490] shadow-sm cursor-pointer'
          }`}
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
