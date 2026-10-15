import React from 'react';
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

function formatSystemRoleBadge(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'super admin') return 'SUPER ADMIN';
  if (r === 'admin') return 'ADMINISTRATOR';
  if (r === 'operator') return 'WATCH OFFICER';
  if (r === 'analyst') return 'ANALYST';
  if (r === 'viewer') return 'VIEWER';
  if (r === 'watch_officer' || r === 'watch officer') return 'WATCH OFFICER';
  return String(role || 'OPERATOR').replace(/_/g, ' ').toUpperCase();
}

function getAccessLevel(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'super admin' || r === 'admin') return 'HIGH';
  if (r === 'viewer') return 'LOW';
  return 'MEDIUM';
}

export default function ProfileHeaderBar({ user: propUser }) {
  const auth = useAuth?.() || {};
  const user = propUser || auth.user;
  const roles = auth.roles || [];

  const primaryRole = getPrimaryRole(user, roles);
  const systemRoleBadge = formatSystemRoleBadge(primaryRole);
  const accessLevel = getAccessLevel(primaryRole);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 relative overflow-hidden select-none font-sans">
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-cyan-400/5 blur-2xl pointer-events-none" />
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-xl font-bold text-on-surface uppercase tracking-tight m-0">
          My Profile
        </h1>
        <div className="flex items-center gap-2 font-mono text-xs text-outline tracking-wider uppercase">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>OPERATOR CONSOLE</span>
          <span className="text-outline-variant">/</span>
          <span className="text-emerald-400 font-semibold">SESSION ACTIVE</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            verified_user
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-outline uppercase font-mono leading-none">
              Access Level
            </span>
            <span className="font-mono text-xs text-on-surface font-semibold leading-tight mt-0.5">
              {accessLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-cyan-400">
            military_tech
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-outline uppercase font-mono leading-none">
              Role Authorization
            </span>
            <span className="font-mono text-xs text-cyan-400 font-semibold leading-tight mt-0.5">
              {systemRoleBadge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
