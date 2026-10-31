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
      <div className="bg-white rounded-sm py-5 px-4 shadow-sm flex flex-col gap-4 relative overflow-hidden border border-slate-200">
        
        {/* Operator Photo with Ping Reticle */}
        <div className="flex flex-col items-center gap-4 pt-1">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-sm overflow-hidden bg-slate-100 shadow-sm relative border border-slate-200">
              <img
                alt={displayName}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                src={
                  user?.profileImg ||
                  user?.profile_img ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBdmkTaKzY9p2f5-sclHBZK9FXjowrY24NumAp25yIjzr7ksveKyJGYRRvnNWv2JlqUE-sGKdGxx95eMbV9pZh3wxQHeA54NGKahaNEGApMwKG5WHWiYBGqXJ75mHSDwaMkmyoxf-VXD5Nz5icvKTN8lXYORWzeYjeG6TBbHPbEenlBSVraRFCiWmYYP6bsrERTkC2W8NFyMXvuwcQrxLnXKyXapuK2eVP63sFE_BohW4dkuJAOYmiH"
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Online status reticle */}
            <div className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center p-1 bg-white rounded-full shadow-sm border border-slate-200">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center min-w-0">
            <span className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              {displayName}
            </span>
            <span className="text-xs text-[#0891b2] font-semibold mt-0.5">
              {roleTitle}
            </span>
            <span className="font-mono text-xs text-slate-500 mt-1 truncate max-w-full">
              {displayEmail}
            </span>
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-sm bg-slate-100 border border-slate-200">
              <span className="material-symbols-outlined text-[14px] text-[#0891b2]">
                shield_with_heart
              </span>
              <span className="text-[11px] text-slate-800 font-semibold tracking-wide uppercase">
                {roleDepartment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
