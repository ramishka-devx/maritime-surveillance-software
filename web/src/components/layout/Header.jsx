import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ChevronDown, Clock, CircleUser, LogOut, Navigation, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';
import { isMaintenance } from '../../auth/roles.js';
import { searchVessels, toUiVessel } from '../../lib/vessels.js';
import { apiRequest } from '../../lib/api.js';

// "27 Oct 2026, 05:31:54", Sri Lanka time.
const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

// "super_admin" -> "Super admin"
function roleLabel(raw) {
  const t = raw.replace(/[_-]/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Header({ onSearch }) {
  const navigate = useNavigate();
  const { user, logout, roles, token } = useAuth();
  const maintenance = isMaintenance(user);
  const { vessels, focusVessel } = useVesselContext();
  const [slTimestamp, setSlTimestamp] = useState('');
  const [searchValue, setSearchValue] = useState('');
  // Server search results, tagged with the query they answer so a late response for an
  // older query is never shown.
  const [remoteSearch, setRemoteSearch] = useState({ q: '', rows: [] });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const displayRole = (() => {
    const userRoles = (roles && roles.length > 0) ? roles : (user?.roles && user.roles.length > 0 ? user.roles : null);
    if (userRoles && userRoles.length > 0) {
      const firstRole = userRoles[0];
      const rawName = typeof firstRole === 'string'
        ? firstRole
        : (firstRole?.name || firstRole?.role_name || firstRole?.title || firstRole?.description);
      if (rawName) {
        return roleLabel(rawName);
      }
    }

    const directRole = user?.role_name || (typeof user?.role === 'string' ? user.role : user?.role?.name);
    if (directRole) {
      return roleLabel(directRole);
    }

    if (user?.role_id === 1) return 'Super admin';
    if (user?.role_id === 2) return 'Operator';

    return user ? 'Operator' : 'Watch officer';
  })();

  useEffect(() => {
    const updateTime = () => setSlTimestamp(clockFormat.format(new Date()));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // AIS positions stored per second over the last minute (null until the first answer).
  const [aisRate, setAisRate] = useState(null);
  useEffect(() => {
    if (!token || maintenance) return undefined;
    const load = () =>
      apiRequest('/api/ais/rate', { token })
        .then((d) => setAisRate(d.positions_per_s))
        .catch(() => setAisRate(null));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [token, maintenance]);

  // "/" focuses the search box, unless the operator is already typing somewhere.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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

  // The context only holds vessels in the current map view (plus the reference fleet), so
  // also search the server, debounced.
  useEffect(() => {
    const q = searchValue.trim();
    if (!q || !token || maintenance) return undefined;
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const rows = await searchVessels(token, q);
        if (!stale) {
          setRemoteSearch({
            q,
            rows: (rows || []).filter((v) => v.lat != null && v.lon != null).map(toUiVessel),
          });
        }
      } catch (err) {
        console.error('Vessel search failed:', err);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [searchValue, token, maintenance]);

  // Local matches first, then server hits not already listed.
  const searchResults = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    const local = (vessels || []).filter((v) => {
      const nameMatch = v.name?.toLowerCase().includes(q);
      const mmsiMatch = String(v.mmsi || '').includes(q);
      const imoMatch = String(v.imo || '').toLowerCase().includes(q);
      const callSignMatch = String(v.callSign || '').toLowerCase().includes(q);
      return nameMatch || mmsiMatch || imoMatch || callSignMatch;
    });
    const remote = remoteSearch.q === searchValue.trim() ? remoteSearch.rows : [];
    const seen = new Set(local.map((v) => String(v.mmsi)));
    return [...local, ...remote.filter((v) => !seen.has(String(v.mmsi)))].slice(0, 6);
  }, [searchValue, vessels, remoteSearch]);

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

  const initials = displayName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-60 right-0 h-16 z-40 py-2 pl-1 pr-5 flex items-center gap-8 bg-bs-bg text-bs-ink font-sans select-none">
      {/* Global search with live vessel autocomplete & map focus */}
      <div className="relative w-[420px] shrink min-w-[220px]" ref={searchContainerRef}>
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bs-neutral-700 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchValue.trim().length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={maintenance ? 'Search' : 'Search MMSI, IMO or vessel name'}
          aria-label="Search vessels"
          className="w-full h-8 pl-8 pr-9 text-[13px] text-bs-ink caret-bs-accent bg-bs-surface border border-bs-ink/[.16] rounded-sm placeholder:text-bs-ink/65 hover:border-bs-ink/45 outline-none focus-visible:border-bs-accent focus-visible:outline-bs-accent focus-visible:outline-offset-0"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-[18px] px-1 flex items-center justify-center text-[11px] font-sans border border-bs-ink/[.16] rounded text-bs-neutral-700">
          /
        </kbd>

        {/* Autocomplete dropdown */}
        {isDropdownOpen && searchValue.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-bs-bg shadow-bs-lg overflow-hidden rounded-md">
            {searchResults.length > 0 ? (
              <div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px] tracking-[0.08em] uppercase text-bs-neutral-700 border-b border-bs-ink/[.16]">
                  <span>Vessels ({searchResults.length})</span>
                  <span className="normal-case tracking-normal italic">Enter or click to zoom</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.map((vessel, index) => {
                    const isSelected = selectedIndex === index;
                    const threat = vessel.threatLevel || 'NORMAL';
                    const tag =
                      threat === 'CRITICAL'
                        ? 'bg-bs-accent-2-100 text-bs-accent-2-700'
                        : threat === 'WARNING'
                        ? 'bg-bs-accent-2-100 text-bs-accent-2-500'
                        : 'bg-bs-neutral-100 text-bs-neutral-800';

                    return (
                      <div
                        key={vessel.id || vessel.mmsi}
                        onClick={() => handleSelectVessel(vessel)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 border-l-2 ${
                          isSelected ? 'bg-bs-surface border-bs-accent' : 'border-transparent hover:bg-bs-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Navigation size={15} className="shrink-0 text-bs-accent-700" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold truncate">{vessel.name}</span>
                              <span className={`text-[11px] px-2 py-px rounded-sm capitalize ${tag}`}>
                                {threat.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-[12px] font-mono text-bs-neutral-700 truncate">
                              MMSI {vessel.mmsi}
                              {vessel.imo && <> · IMO {vessel.imo}</>}
                              {vessel.type && <span className="font-sans italic"> · {vessel.type}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 text-[12px]">
                          <div className="font-semibold text-bs-accent-700 tabular-nums">{vessel.speed || 0} kn</div>
                          <div className="italic text-bs-neutral-700 truncate max-w-[120px]">
                            {vessel.destination || 'Open sea'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-center text-[13px] italic text-bs-neutral-800">
                No vessels match &ldquo;{searchValue}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live feed + clock */}
      {aisRate !== null && (
        <div className="hidden xl:flex items-baseline gap-2 text-[14px]" title="AIS positions stored per second, last minute">
          <span className={`self-center w-[7px] h-[7px] rounded-full ${aisRate > 0 ? 'bg-bs-accent' : 'bg-bs-neutral-400'}`} />
          <span className="font-semibold tabular-nums">{aisRate.toLocaleString()}</span>
          <span className="italic text-bs-neutral-700 text-[13px]">{aisRate > 0 ? 'positions / s, AIS stream' : 'AIS stream idle'}</span>
        </div>
      )}
      <div className="hidden lg:flex items-center gap-2" title="Sri Lanka Standard Time (UTC+05:30)">
        <Clock size={17} className="text-bs-neutral-700" />
        <span className="font-mono font-semibold text-[13px] tabular-nums">{slTimestamp}</span>
        <span className="italic text-bs-neutral-700 text-[13px]">SLST</span>
      </div>

      {/* User menu */}
      <details className="relative ml-auto group">
        <summary className="list-none flex items-center gap-3 cursor-pointer outline-none focus-visible:outline-bs-accent [&::-webkit-details-marker]:hidden">
          <span className="w-9 h-9 rounded-full bg-bs-surface grid place-items-center font-semibold text-[13px]">
            {initials}
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block text-[14px] font-semibold">{displayName}</span>
            <span className="block text-[12px] italic text-bs-neutral-700">{displayRole}</span>
          </span>
          <ChevronDown size={15} className="text-bs-neutral-700 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute right-0 top-full mt-2 w-48 z-50 bg-bs-bg shadow-bs-lg py-1 text-[14px]">
          <button
            onClick={() => navigate('/Profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-bs-surface"
          >
            <CircleUser size={16} className="text-bs-neutral-700" />
            My profile
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-bs-accent-2-700 hover:bg-bs-accent-2-100"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </details>
    </header>
  );
}
