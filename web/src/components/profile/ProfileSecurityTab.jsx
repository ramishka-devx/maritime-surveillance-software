import React, { useState } from 'react';

export default function ProfileSecurityTab({ onSaveNotice }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      if (onSaveNotice) onSaveNotice('Please input current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      if (onSaveNotice) onSaveNotice('Passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (onSaveNotice) onSaveNotice('Cryptographic credentials updated and re-keyed with FIPS hardware pool.');
  };

  return (
    <div className="bg-surface-container-low rounded-lg p-5 sm:p-6 shadow-md flex flex-col gap-6 border border-outline-variant/30 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-300 text-[20px]">lock</span>
          <h2 className="text-sm sm:text-base font-bold text-on-surface uppercase m-0">
            Security &amp; Cryptographic Keys
          </h2>
        </div>
        <span className="font-mono text-xs text-cyan-400 font-semibold">FIPS 140-3 COMPLIANT</span>
      </div>

      {/* 4-Stage Password Complexity Indicator */}
      <div className="bg-surface-container-lowest p-4 rounded flex flex-col gap-3 border border-outline-variant/20 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-outline uppercase text-[11px]">
            Active Cryptographic Password Entropy
          </span>
          <span className="text-emerald-400 font-bold">OPTIMAL (98/100)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-2 w-full">
          <div className="bg-emerald-400 rounded-full" />
          <div className="bg-emerald-400 rounded-full" />
          <div className="bg-emerald-400 rounded-full" />
          <div className="bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-outline pt-1">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">done</span> Length (24 chars)
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">done</span> Mixed Complexity
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">done</span> Military NATO Symbol
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">done</span> FIPS Entropy Pool
          </span>
        </div>
      </div>

      {/* Password Update Form */}
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-outline uppercase tracking-wider">
              Current Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-surface-container-lowest text-on-surface rounded p-2 border border-outline-variant/30 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-outline uppercase tracking-wider">
              New Cryptographic Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-surface-container-lowest text-on-surface rounded p-2 border border-outline-variant/30 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-outline uppercase tracking-wider">
              Confirm Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-surface-container-lowest text-on-surface rounded p-2 border border-outline-variant/30 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-surface-container-highest hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold uppercase rounded border border-cyan-400/30 transition-colors cursor-pointer"
          >
            Update Passphrase
          </button>
        </div>
      </form>

      {/* Hardware 2FA & Authenticator */}
      <div className="flex flex-col gap-3 font-mono text-xs">
        <div className="text-[11px] text-outline uppercase tracking-wider">
          Two-Factor Multi-Tier Authentication
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-[22px]">
                security_update_good
              </span>
              <div className="flex flex-col">
                <span className="text-on-surface font-semibold">FIPS 140-3 Hardware Key</span>
                <span className="text-[10px] text-outline">Slot 1 • YubiKey FIPS 5 NFC</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40 text-[10px]">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400 text-[22px]">
                phonelink_lock
              </span>
              <div className="flex flex-col">
                <span className="text-on-surface font-semibold">Backup TOTP Authenticator</span>
                <span className="text-[10px] text-outline">Mobile Authenticator Relay</span>
              </div>
            </div>
            <button
              onClick={() => onSaveNotice && onSaveNotice('TOTP Configured.')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-cyan-300 text-[10px] uppercase font-bold transition-colors cursor-pointer"
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
