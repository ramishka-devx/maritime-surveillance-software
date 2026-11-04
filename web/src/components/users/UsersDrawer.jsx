import React, { useState } from 'react';

export default function UsersDrawer({ isOpen, onClose, onCreateUser }) {
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [role, setRole] = useState();
  const [tempKey, setTempKey] = useState();
  const [requireRotation, setRequireRotation] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let key = 'SG-';
    for (let i = 0; i < 13; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempKey(key);
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(tempKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onCreateUser({
      name: name.trim(),
      email: email.trim(),
      role: role === 'admin' ? 'Administrator' : role === 'analyst' ? 'Analyst' : 'Operator',
      tempKey,
      status: 'ACTIVE',
      lastLogin: 'Never (Pending)',
      provisioned: new Date().toISOString().slice(0, 10),
    });

    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Slide-over Drawer */}
      <aside className="fixed right-0 top-16 bottom-0 w-[440px] max-w-[90vw] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between font-sans select-none animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-900">
                Create User
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 font-mono text-xs">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-slate-600">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                person
              </span>
              <input
                className="w-full bg-slate-50 rounded-sm pl-8 pr-3 py-2 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0891b2] transition-colors"
                placeholder="e.g. Lt. Cmdr. Elena Rostova"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Official Email */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-slate-600">
                Official Maritime Email
              </label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                mail
              </span>
              <input
                className="w-full bg-slate-50 rounded-sm pl-8 pr-3 py-2 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0891b2] transition-colors"
                placeholder="username@serenguard.maritime.mil"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-slate-600">
              Role &amp; Privilege Tier
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0891b2] text-[18px]">
                security
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 rounded-sm pl-8 pr-8 py-2 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0891b2] appearance-none cursor-pointer"
              >
                <option value="operator" className="bg-white text-slate-900">Watch Operator</option>
                <option value="admin" className="bg-white text-slate-900">Administrator</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Temporary Cryptographic Key */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-slate-600">
                Temporary Cryptographic Key
              </label>
              <button
                type="button"
                onClick={handleGenerateKey}
                className="text-[#0891b2] hover:text-[#0e7490] hover:underline uppercase flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">casino</span>
                <span>Generate Key</span>
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                key
              </span>
              <input
                className="w-full bg-slate-50 rounded-sm pl-8 pr-10 py-2 text-[#0891b2] font-mono font-bold text-xs border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0891b2] transition-colors"
                type="text"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCopyKey}
                title="Copy key"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0891b2] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Security Protocol Banner */}
          <div className="p-3 rounded-sm bg-cyan-50/70 border border-cyan-200 flex items-start gap-2 mt-3">
            <span className="material-symbols-outlined text-[#0891b2] text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <p className="text-[10px] text-slate-600 leading-normal m-0">
              User will receive an encrypted authorization beacon token via authenticated Gov/Mil secure relay. Verification expires in 24 hours.
            </p>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#0891b2] text-white hover:bg-[#0e7490] font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            <span>Create User</span>
          </button>
        </div>
      </aside>
    </>
  );
}
