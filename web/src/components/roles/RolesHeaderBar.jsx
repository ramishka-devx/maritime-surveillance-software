import React from 'react';

export default function RolesHeaderBar({
  onDiscard,
  onSave,
  hasChanges = false,
  isSaving = false,
  affectedUsersCount = 0,
}) {
  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 select-none font-sans">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-3 mt-0.5">
          <h1 className="text-xl font-bold uppercase tracking-tight text-on-surface m-0">
            Roles &amp; Permissions
          </h1>
          <span className="hidden sm:inline-block font-mono text-xs text-cyan-400/80">
            RBAC ACCESS CONTROL
          </span>
        </div>
      </div>

      {/* Header Alert & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end font-mono text-xs">
        {/* Live Warning Pill */}
        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse">
            <span className="material-symbols-outlined text-[16px] text-amber-400">warning</span>
            <span className="font-medium text-[11px]">
              Unsaved changes affect <span className="font-bold underline decoration-amber-400">{affectedUsersCount} {affectedUsersCount === 1 ? 'user' : 'users'}</span>
            </span>
          </div>
        )}

        {/* Discard Action */}
        <button
          type="button"
          onClick={onDiscard}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container-low border border-outline-variant/50 transition-all uppercase tracking-wider ${
            !hasChanges || isSaving
              ? 'opacity-40 cursor-not-allowed text-outline'
              : 'hover:border-outline text-on-surface hover:text-cyan-400 cursor-pointer'
          }`}
          title={hasChanges ? 'Reset matrix changes back to server baseline' : 'No changes to discard'}
        >
          <span className="material-symbols-outlined text-[16px] text-outline">restart_alt</span>
          <span>Discard</span>
        </button>

        {/* Save Action */}
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded font-bold uppercase tracking-wider transition-all ${
            !hasChanges || isSaving
              ? 'opacity-40 cursor-not-allowed bg-surface-container-high text-outline border border-outline-variant/40'
              : 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.4)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] cursor-pointer'
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
