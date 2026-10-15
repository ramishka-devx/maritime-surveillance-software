import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import serenGuardLogo from '../../assets/SerenGuard.png';

export default function Sidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on route or prop
  const currentActiveTab =
    activeTab ||
    (location.pathname.toLowerCase().startsWith('/alerts')
      ? 'alerts'
      : location.pathname === '/' || location.pathname.startsWith('/map')
      ? 'map'
      : 'map');

  const operationsNav = [
    { id: 'map', label: 'Map', icon: 'map', path: '/' },
    { id: 'alerts', label: 'Alerts', icon: 'warning', badge: '14', badgeType: 'error', path: '/Alerts' },
    { id: 'vessels', label: 'Vessels', icon: 'directions_boat' },
    { id: 'anomalies', label: 'Anomalies', icon: 'troubleshoot' },
    { id: 'restricted-areas', label: 'Restricted Areas', icon: 'fence' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  ];

  const adminNav = [
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: 'admin_panel_settings' },
    { id: 'audit-log', label: 'Audit Log', icon: 'history' },
    { id: 'detection-settings', label: 'Detection Settings', icon: 'tune' },
    { id: 'system-health', label: 'System Health', icon: 'health_and_safety', extra: '99.98%' },
  ];

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-low border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none font-sans">
      <div className="flex flex-col">
        {/* Logo Brand Header */}
        <div
          onClick={() => navigate('/')}
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
              Maritime Surveillance Ops
            </span>
          </div>
        </div>

        {/* Operations Navigation */}
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

        {/* Administration Navigation */}
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
      </div>

      {/* System Status / DEFCON Indicator */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest/60">
        <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
          <span className="text-outline">DEFCON STATUS</span>
          <span className="text-tertiary font-bold">DEFCON 3</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
          <div className="bg-tertiary h-full w-3/5 rounded-full shadow-[0_0_8px_rgba(77,212,239,0.5)]" />
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-outline/80 mt-2">
          <span>SURVEILLANCE GRID</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        </div>
      </div>
    </aside>
  );
}
