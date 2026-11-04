import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CircleUser,
  FileText,
  HeartPulse,
  LayoutGrid,
  Map as MapIcon,
  Pentagon,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useBadgeCounts } from '../../hooks/useBadgeCounts';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePermission } from '../../auth/usePermission.js';
import { isAnalyst, isMaintenance, isOperator } from '../../auth/roles.js';

const sectionLabel = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700 mb-2.5';

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2 text-left text-[15px] outline-none focus-visible:outline-bs-accent ${
        active ? 'text-bs-accent-700 font-semibold' : 'text-bs-ink hover:text-bs-accent-700'
      }`}
    >
      <Icon size={19} className={active ? '' : 'text-bs-neutral-700'} />
      <span className="flex-1 whitespace-nowrap">{item.label}</span>
      {active && <span className="w-1.5 h-1.5 bg-bs-accent" />}
      {!active && item.badge ? (
        <span
          className={`text-[13px] tabular-nums ${item.alert ? 'font-semibold text-bs-accent-2-700' : 'text-bs-neutral-700'}`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermission();
  const maintenance = isMaintenance(user);
  const { alertCount, restrictedAreaCount } = useBadgeCounts();

  // Determine active tab based on current URL path
  const pathname = location.pathname.toLowerCase();
  const currentActiveTab =
    pathname.startsWith('/alerts')
      ? 'alerts'
      : pathname.startsWith('/restricted')
      ? 'restricted-areas'
      : pathname.startsWith('/dashboard')
      ? 'dashboard'
      : pathname.startsWith('/reports')
      ? 'reports'
      : pathname.startsWith('/users')
      ? 'users'
      : pathname.startsWith('/roles')
      ? 'roles-permissions'
      : pathname.startsWith('/detection')
      ? 'detection-settings'
      : pathname.startsWith('/system-health') || pathname.startsWith('/systemhealth') || pathname.startsWith('/health')
      ? 'system-health'
      : pathname.startsWith('/profile') || pathname.startsWith('/my-profile')
      ? 'my-profile'
      : pathname === '/' || pathname.startsWith('/map')
      ? 'map'
      : pathname.slice(1) || 'map';

  const operationsNav = maintenance ? [] : [
    { id: 'map', label: 'Map', icon: MapIcon, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/Dashboard' },
    { id: 'alerts', label: 'Alerts', icon: TriangleAlert, badge: alertCount, alert: true, path: '/Alerts' },
    { id: 'restricted-areas', label: 'Restricted areas', icon: Pentagon, badge: restrictedAreaCount, path: '/RestrictedAreas' },
    ...(can('reports.view') ? [{ id: 'reports', label: 'Reports', icon: FileText, path: '/Reports' }] : []),
    { id: 'my-profile', label: 'My profile', icon: CircleUser, path: '/Profile' },
  ];

  const adminNav = maintenance ? [
    { id: 'system-health', label: 'System health', icon: HeartPulse, path: '/SystemHealth' },
  ] : isOperator(user) || isAnalyst(user) ? [] : [
    { id: 'users', label: 'Users', icon: Users, path: '/Users' },
    { id: 'roles-permissions', label: 'Roles & access', icon: ShieldCheck, path: '/RolesPermissions' },
    { id: 'detection-settings', label: 'Detection settings', icon: SlidersHorizontal, path: '/DetectionSettings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 z-50 flex flex-col p-5 bg-bs-bg text-bs-ink select-none font-sans">
      <button
        onClick={() => navigate(maintenance ? '/SystemHealth' : '/')}
        className="text-left outline-none focus-visible:outline-bs-accent"
      >
        <div className="font-semibold text-[22px] leading-[1.05] tracking-[-0.02em]">SerenGuard</div>
        <div className="italic text-[12px] text-bs-neutral-700 mt-1">Maritime surveillance</div>
      </button>

      {operationsNav.length > 0 && (
        <div className="mt-10">
          <div className={sectionLabel}>Operations</div>
          <nav className="flex flex-col gap-0.5">
            {operationsNav.map((item) => (
              <NavItem key={item.id} item={item} active={currentActiveTab === item.id} onClick={() => navigate(item.path)} />
            ))}
          </nav>
        </div>
      )}

      {adminNav.length > 0 && (
        <div className="mt-8">
          <div className={sectionLabel}>Administration</div>
          <nav className="flex flex-col gap-0.5">
            {adminNav.map((item) => (
              <NavItem key={item.id} item={item} active={currentActiveTab === item.id} onClick={() => navigate(item.path)} />
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
