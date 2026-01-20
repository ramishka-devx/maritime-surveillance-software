import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SerenGuardLogo from '../assets/SerenGuard.png';

function formatRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin') return 'Super Admin';
  if (r === 'operator') return 'Operator';
  return role || 'Guest';
}

function displayName(user) {
  const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return full || user?.username || user?.email || 'User';
}

export default function Navbar({ user, links, onLogout }) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-8 px-6 py-3 bg-gradient-to-b from-[#0b1220] to-[#111b2e] border-b border-[rgba(255,255,255,0.08)] shadow-lg">
      <div className="flex items-center gap-3">
        <img src={SerenGuardLogo} alt="SerenGuard Logo" className="w-11 h-11 rounded-lg object-contain" />
        <div>
          <div className="text-base font-bold text-white leading-tight">SerenGuard</div>
          <div className="text-xs text-[#9aa8c7] leading-tight">Maritime Surveillance</div>
        </div>
      </div>

      <nav className="flex gap-8 justify-center">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm font-semibold transition-all duration-300 ${
              pathname === link.to
                ? 'text-[#f28c1b] border-b-2 border-[#f28c1b]'
                : 'text-[#9aa8c7] hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs font-semibold text-[#9aa8c7] uppercase tracking-wider">{formatRole(user?.role)}</div>
          <div className="text-sm font-semibold text-white">{displayName(user)}</div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-semibold bg-[#f28c1b] text-white rounded-lg hover:bg-[#d97706] transition-all duration-300"
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
