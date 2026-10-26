import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import serenGuardLogo from '../../assets/SerenGuard.png';
import { useBadgeCounts } from '../../hooks/useBadgeCounts';
import { useAuth } from '../../auth/AuthContext.jsx';
import { isMaintenance, isOperator } from '../../auth/roles.js';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const maintenance = isMaintenance(user);
  const { alertCount, anomalyCount, restrictedAreaCount } = useBadgeCounts();

  // Determine active tab based on current URL path
  const pathname = location.pathname.toLowerCase();
  const currentActiveTab =
    pathname.startsWith('/alerts')
      ? 'alerts'
      : pathname.startsWith('/anomalies')
      ? 'anomalies'
      : pathname.startsWith('/restricted')
      ? 'restricted-areas'
      : pathname.startsWith('/dashboard')
      ? 'dashboard'
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
    { id: 'map', label: 'Map', icon: 'map', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/Dashboard' },
    { id: 'alerts', label: 'Alerts', icon: 'warning', badge: alertCount, badgeType: 'error', path: '/Alerts' },
    { id: 'anomalies', label: 'Anomalies', icon: 'troubleshoot', badge: anomalyCount, badgeType: 'error', path: '/Anomalies' },
    { id: 'restricted-areas', label: 'Restricted Areas', icon: 'fence', badge: restrictedAreaCount, badgeType: 'error', path: '/RestrictedAreas' },
    { id: 'my-profile', label: 'My Profile', icon: 'account_circle', path: '/Profile' },
  ];

  const adminNav = maintenance ? [
    { id: 'system-health', label: 'System Health', icon: 'health_and_safety', path: '/SystemHealth' },
  ] : isOperator(user) ? [] : [
    { id: 'users', label: 'Users', icon: 'group', path: '/Users' },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: 'admin_panel_settings', path: '/RolesPermissions' },
  ];

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-low border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none font-sans">
      <div className="flex flex-col">
        {/* Logo Brand Header */}
        <div
          onClick={() => navigate(maintenance ? '/SystemHealth' : '/')}
          className="h-16 px-4 border-b border-outline-variant/30 flex items-center gap-2.5 bg-surface-container-lowest cursor-pointer hover:bg-surface-container/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg border border-cyan-500/40 p-1 flex items-center justify-center shadow-lg shadow-cyan-950/40 bg-surface-container-low">
            <img src={serenGuardLogo} alt="SerenGuard Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-on-surface uppercase leading-none">
              SerenGuard
            </span>
            <span className="text-[10px] font-mono text-primary tracking-wider uppercase mt-1 leading-none">
              Maritime Surveillance
            </span>
          </div>
        </div>

        {/* Operations Navigation */}
        {operationsNav.length > 0 && (
        <div className="py-4">
          <div className="px-4 pb-2 text-[10px] font-mono uppercase tracking-widest text-outline">
            Operations
          </div>
          <nav className="space-y-0.5 px-2">
            {operationsNav.map((item) => {
              const isActive = currentActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${
                        item.badgeType === 'error'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-primary-container text-on-primary-container'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        )}

        {/* Administration Navigation */}
        {adminNav.length > 0 && (
        <div className="py-2 border-t border-outline-variant/20">
          <div className="px-4 pb-2 text-[10px] font-mono uppercase tracking-widest text-outline">
            Administration
          </div>
          <nav className="space-y-0.5 px-2">
            {adminNav.map((item) => {
              const isActive = currentActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.extra && (
                    <span className="text-[10px] font-mono text-tertiary">
                      {item.extra}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        )}
      </div>

      {/* System Status / DEFCON Indicator */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest/60">
        <div className="flex items-center justify-between font-mono text-[10px] mb-2">
          <span className="text-outline">OPERATION STATUS</span>
          <span className="text-tertiary font-bold">ONLINE</span>
        </div>
        
      </div>
    </aside>
  );
}
