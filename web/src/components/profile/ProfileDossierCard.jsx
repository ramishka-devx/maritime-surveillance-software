import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';

function getPrimaryRole(user, authRoles = []) {
  if (user?.role) return String(user.role);
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    const first = user.roles[0];
    return typeof first === 'object' ? first.name : String(first);
  }
  if (Array.isArray(authRoles) && authRoles.length > 0) {
    const first = authRoles[0];
    return typeof first === 'object' ? first.name : String(first);
  }
  if (user?.role_id === 1) return 'super_admin';
  if (user?.role_id === 2) return 'operator';
  return 'operator';
}

function formatDossierRoleTitle(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'super admin') return 'Super Administrator';
  if (r === 'admin') return 'System Administrator';
  if (r === 'operator' || r === 'watch_officer' || r === 'watch officer') {
    return 'Watch Officer';
  }
  const clean = r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${clean} / Maritime Operator`;
}

function formatRoleDepartment(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'super admin') return 'High Level';
  if (r === 'admin') return 'System Administration';
  if (r === 'operator') return 'Operator';
  return 'Operational Watch Staff';
}

export default function ProfileDossierCard({ user: propUser }) {
  const auth = useAuth?.() || {};
  const user = propUser || auth.user;
  const roles = auth.roles || [];

  const [sessionSeconds, setSessionSeconds] = useState(2 * 3600 + 47 * 60 + 18);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (total) => {
    const hrs = String(Math.floor(total / 3600)).padStart(2, '0');
    const mins = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const secs = String(total % 60).padStart(2, '0');
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'LT. CARLOS MARTINEZ'
    : 'LT. CARLOS MARTINEZ';

  const displayEmail = user?.email || 'c.martinez@serenguard.maritime.mil';
  const primaryRole = getPrimaryRole(user, roles);
  const roleTitle = formatDossierRoleTitle(primaryRole);
  const roleDepartment = formatRoleDepartment(primaryRole);

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      {/* Main Identity Dossier Card */}
      <div className="bg-surface-container-low rounded-lg p-5 shadow-md flex flex-col gap-4 relative overflow-hidden border border-outline-variant/30">
        
        {/* Operator Photo with Ping Reticle */}
        <div className="flex flex-col sm:flex-row xl:flex-col items-center gap-4 pt-1">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-surface-container-lowest shadow-md relative border border-outline-variant/40">
              <img
                alt={displayName}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                src={
                  user?.profileImg ||
                  user?.profile_img ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBdmkTaKzY9p2f5-sclHBZK9FXjowrY24NumAp25yIjzr7ksveKyJGYRRvnNWv2JlqUE-sGKdGxx95eMbV9pZh3wxQHeA54NGKahaNEGApMwKG5WHWiYBGqXJ75mHSDwaMkmyoxf-VXD5Nz5icvKTN8lXYORWzeYjeG6TBbHPbEenlBSVraRFCiWmYYP6bsrERTkC2W8NFyMXvuwcQrxLnXKyXapuK2eVP63sFE_BohW4dkuJAOYmiH"
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Online status reticle */}
            <div className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center p-1 bg-surface-container-lowest rounded-full shadow-md border border-outline-variant/40">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start xl:items-center text-center sm:text-left xl:text-center min-w-0">
            <span className="text-lg font-bold text-on-surface uppercase tracking-tight">
              {displayName}
            </span>
            <span className="text-xs text-cyan-400 font-semibold mt-0.5">
              {roleTitle}
            </span>
            <span className="font-mono text-xs text-outline mt-1 truncate max-w-full">
              {displayEmail}
            </span>
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">
                shield_with_heart
              </span>
              <span className="text-[11px] text-on-surface font-semibold tracking-wide uppercase">
                {roleDepartment}
              </span>
            </div>
          </div>
        </div>

        {/* Teleprinter Telemetry Specs */}
        <div className="flex flex-col gap-1 bg-surface-container-lowest p-3 rounded border border-outline-variant/20 font-mono text-xs">
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">call</span> Call Sign
            </span>
            <span className="text-cyan-400 font-semibold">TRITON-4</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">cell_tower</span> Station
            </span>
            <span className="text-on-surface">Dover VTS Sector 04</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">history</span> Last Login
            </span>
            <span className="text-on-surface-variant">13:45:12 UTC (47m ago)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">router</span> Terminal IP
            </span>
            <span className="text-blue-300">192.168.42.108 [VPN]</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">timer</span> Active Session
            </span>
            <span className="text-emerald-400 font-semibold">{formatSessionTime(sessionSeconds)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-outline uppercase flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-[14px]">key</span> Crypto Token
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> FIPS 140-3 HW Key
            </span>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <button
            onClick={() => alert('Photo upload dialog dispatched.')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-cyan-400">add_a_photo</span>
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => alert('Digital Security Keycard exported.')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-300">download</span>
            <span>Keycard</span>
          </button>
        </div>

        {/* Operational Verification Sparkline */}
        <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-outline uppercase text-[10px]">Shift Triage Throughput</span>
            <span className="text-cyan-400 font-bold">94.8% SLA</span>
          </div>
          <svg className="w-full h-8 text-cyan-400 overflow-visible" fill="none" viewBox="0 0 280 32">
            <path
              d="M0,24 L25,20 L50,22 L75,14 L100,16 L125,8 L150,11 L175,6 L200,9 L225,4 L250,7 L280,3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <circle cx="280" cy="3" fill="currentColor" r="3" />
          </svg>
        </div>
      </div>

      {/* Standing Orders Directives Card */}
      <div className="bg-surface-container-low rounded-lg p-4 shadow-md flex flex-col gap-2 border border-outline-variant/30">
        <div className="text-xs text-on-surface uppercase font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-cyan-400">assignment</span>
            <span>Standing Orders</span>
          </span>
          <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
        </div>
        <p className="font-mono text-xs text-on-surface-variant m-0 leading-relaxed">
          Mandatory radio watch on VHF Ch 16 &amp; 67. All unidentified radar contacts crossing Sector 04 boundary require immediate MMSI AIS cross-check within 90 seconds.
        </p>
      </div>
    </div>
  );
}
