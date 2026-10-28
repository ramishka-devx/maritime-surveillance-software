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
    <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-6 border border-slate-200 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">lock</span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase m-0">
            Security &amp; Cryptographic Keys
          </h2>
        </div>
        <span className="font-mono text-xs text-[#0891b2] font-semibold">FIPS 140-3 COMPLIANT</span>
      </div>

      {/* 4-Stage Password Complexity Indicator */}
      <div className="bg-slate-50 p-4 rounded flex flex-col gap-3 border border-slate-200 shadow-xs font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase text-[11px]">
            Active Cryptographic Password Entropy
          </span>
          <span className="text-emerald-700 font-bold">OPTIMAL (98/100)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-2 w-full">
          <div className="bg-emerald-500 rounded-full" />
          <div className="bg-emerald-500 rounded-full" />
          <div className="bg-emerald-500 rounded-full" />
          <div className="bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1">
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">done</span> Length (24 chars)
          </span>
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">done</span> Mixed Complexity
          </span>
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">done</span> Military NATO Symbol
          </span>
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">done</span> FIPS Entropy Pool
          </span>
        </div>
      </div>

      {/* Password Update Form */}
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">
              Current Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-slate-50 text-slate-900 rounded p-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">
              New Cryptographic Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-slate-50 text-slate-900 rounded p-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">
              Confirm Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-50 text-slate-900 rounded p-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-[#0891b2] hover:text-white text-[#0891b2] font-bold uppercase rounded border border-cyan-200 transition-colors cursor-pointer"
          >
            Update Passphrase
          </button>
        </div>
      </form>

      {/* Hardware 2FA & Authenticator */}
      <div className="flex flex-col gap-3 font-mono text-xs">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider">
          Two-Factor Multi-Tier Authentication
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                security_update_good
              </span>
              <div className="flex flex-col">
                <span className="text-slate-900 font-semibold">FIPS 140-3 Hardware Key</span>
                <span className="text-[10px] text-slate-500">Slot 1 • YubiKey FIPS 5 NFC</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0891b2] text-[22px]">
                phonelink_lock
              </span>
              <div className="flex flex-col">
                <span className="text-slate-900 font-semibold">Backup TOTP Authenticator</span>
                <span className="text-[10px] text-slate-500">Mobile Authenticator Relay</span>
              </div>
            </div>
            <button
              onClick={() => onSaveNotice && onSaveNotice('TOTP Configured.')}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-[#0891b2] border border-cyan-200 text-[10px] uppercase font-bold transition-colors cursor-pointer shadow-xs"
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
