import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';

export default function Header({ onSearch, sector = 'SECTOR 04 - DOVER' }) {
  const navigate = useNavigate();
  const { user, logout, roles } = useAuth();
  const { vessels, focusVessel } = useVesselContext();
  const [slTimestamp, setSlTimestamp] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  const displayRole = (() => {
    const userRoles = (roles && roles.length > 0) ? roles : (user?.roles && user.roles.length > 0 ? user.roles : null);
    if (userRoles && userRoles.length > 0) {
      const firstRole = userRoles[0];
      const rawName = typeof firstRole === 'string'
        ? firstRole
        : (firstRole?.name || firstRole?.role_name || firstRole?.title || firstRole?.description);
      if (rawName) {
        return rawName.replace(/[_-]/g, ' ').toUpperCase();
      }
    }

    const directRole = user?.role_name || (typeof user?.role === 'string' ? user.role : user?.role?.name);
    if (directRole) {
      return directRole.replace(/[_-]/g, ' ').toUpperCase();
    }

    if (user?.role_id === 1) return 'SUPER ADMIN';
    if (user?.role_id === 2) return 'OPERATOR';

    return user ? 'OPERATOR' : 'WATCH OFFICER';
  })();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';
      const year = getPart('year');
      const month = getPart('month');
      const day = getPart('day');
      const hours = getPart('hour');
      const minutes = getPart('minute');
      const seconds = getPart('second');

      setSlTimestamp(`${year}-${month}-${day} ${hours}:${minutes}:${seconds} SLST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter vessels matching current search query
  const searchResults = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return (vessels || [])
      .filter((v) => {
        const nameMatch = v.name?.toLowerCase().includes(q);
        const mmsiMatch = String(v.mmsi || '').includes(q);
        const imoMatch = String(v.imo || '').toLowerCase().includes(q);
        const callSignMatch = String(v.callSign || '').toLowerCase().includes(q);
        return nameMatch || mmsiMatch || imoMatch || callSignMatch;
      })
      .slice(0, 6);
  }, [searchValue, vessels]);

  const handleSelectVessel = (vessel) => {
    if (!vessel) return;
    focusVessel(vessel, 9);
    setSearchValue(vessel.name || String(vessel.mmsi));
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    if (onSearch) onSearch(vessel.name || String(vessel.mmsi));
  };

  const handleSearchSubmit = () => {
    if (selectedIndex >= 0 && searchResults[selectedIndex]) {
      handleSelectVessel(searchResults[selectedIndex]);
      return;
    }
    if (searchResults.length > 0) {
      handleSelectVessel(searchResults[0]);
      return;
    }
    const exact = (vessels || []).find(
      (v) =>
        String(v.mmsi) === searchValue.trim() ||
        v.name?.toLowerCase() === searchValue.trim().toLowerCase() ||
        String(v.imo) === searchValue.trim()
    );
    if (exact) {
      handleSelectVessel(exact);
      return;
    }
    if (onSearch) onSearch(searchValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setIsDropdownOpen(true);
    setSelectedIndex(-1);
    if (onSearch) onSearch(e.target.value);
  };

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'LT. C. MARTINEZ'
    : 'LT. C. MARTINEZ';

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/30 z-40 px-4 flex items-center justify-between gap-4 font-sans select-none">
      {/* Global Search Bar with Live Vessel Autocomplete & Map Focus */}
      <div className="flex-1 max-w-xl relative" ref={searchContainerRef}>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchValue.trim().length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search MMSI, IMO or Vessel name..."
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded pl-3.5 pr-10 py-1.5 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-2 text-outline hover:text-cyan-400 p-1 rounded transition-colors flex items-center justify-center cursor-pointer"
            title="Search & Zoom to Vessel"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && searchValue.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#070e1c]/95 backdrop-blur-md border border-cyan-500/30 rounded-md shadow-2xl overflow-hidden font-mono">
            {searchResults.length > 0 ? (
              <div>
                <div className="px-3 py-1.5 bg-surface-container-highest/60 border-b border-outline-variant/20 flex items-center justify-between text-[10px] text-outline uppercase tracking-wider">
                  <span>AIS Targets Detected ({searchResults.length})</span>
                  <span className="text-cyan-400/80">Press Enter or click to zoom</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
                  {searchResults.map((vessel, index) => {
                    const isSelected = selectedIndex === index;
                    const threat = vessel.threatLevel || 'NORMAL';
                    const badgeColor =
                      threat === 'CRITICAL'
                        ? 'text-red-400 bg-red-500/10 border-red-500/30'
                        : threat === 'WARNING'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

                    return (
                      <div
                        key={vessel.id || vessel.mmsi}
                        onClick={() => handleSelectVessel(vessel)}
                        className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-l-2 border-cyan-400'
                            : 'hover:bg-surface-container hover:border-l-2 hover:border-cyan-400/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-[18px] text-cyan-400 shrink-0">
                            navigation
                          </span>
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-on-surface truncate">
                                {vessel.name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${badgeColor}`}
                              >
                                {threat}
                              </span>
                            </div>
                            <div className="text-[10px] text-outline truncate">
                              MMSI: <span className="text-on-surface-variant">{vessel.mmsi}</span>
                              {vessel.imo && (
                                <>
                                  {' '}• IMO: <span className="text-on-surface-variant">{vessel.imo}</span>
                                </>
                              )}
                              {' '}• {vessel.type}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 text-[10px] text-outline">
                          <div className="text-cyan-400 font-semibold">
                            {vessel.speed || 0} KTS
                          </div>
                          <div className="text-[9px] text-outline/80 truncate max-w-[120px]">
                            {vessel.destination || 'OPEN SEA'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-center text-xs text-outline font-mono">
                No vessel targets found matching &ldquo;{searchValue}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-3">
        {/* AIS Live Telemetry */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-surface-container-lowest rounded border border-outline-variant/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-mono text-xs text-on-surface">9,420 pkts/s</span>
          <span className="font-mono text-[10px] text-outline">AIS STREAM</span>
        </div>

        {/* Real-time Sri Lanka Standard Time Chronometer */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest rounded border border-outline-variant/30 font-mono text-xs text-on-surface"
          title="Sri Lanka Standard Time (Asia/Colombo UTC+05:30)"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
          <span>{slTimestamp}</span>
        </div>

        {/* User Identity Badge & Action */}
        <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
          <div
            onClick={() => navigate('/Profile')}
            title="View My Profile"
            className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-xs font-mono text-primary">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left pr-4">
              <span className="text-xs font-semibold font-mono text-on-surface leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-outline font-mono leading-tight uppercase">
                {displayRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="ml-1 mr-2 p-1 text-outline hover:text-red-400 hover:bg-surface-container rounded transition-colors"
            title="Disconnect Terminal Session"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
