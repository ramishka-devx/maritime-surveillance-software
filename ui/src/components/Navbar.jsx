import React from "react";
import { Link, useLocation } from "react-router-dom";
import SerenGuardLogo from "../assets/SerenGuard.png";

function Navbar({ user, links, onLogout }) {
  const { pathname } = useLocation();

  return (
    <header className="bg-[#1b397e] sticky top-0 z-50 w-full border-b border-white/20">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-accent-orange/25 blur-lg opacity-70" />
            <img
              src={SerenGuardLogo}
              alt="SerenGuard Logo"
              className="relative h-10 w-10 rounded-xl bg-white/5 p-1 object-contain"
            />
          </div>

          <div className="leading-tight">
            <div className="text-[18px] font-extrabold tracking-wide text-white">
              SerenGuard
            </div>
            <div className="text-[13px] font-semibold text-[#b9c6e6]">
              Maritime Surveillance
            </div>
          </div>
        </div>

        <nav className="mx-auto hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const active = pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "group relative flex items-center rounded-xl px-4 py-2",
                  "text-base font-semibold transition",
                  active ? "text-white" : "text-[#b9c6e6] hover:text-white",
                ].join(" ")}
              >
                {link.label}

                <span
                  className={[
                    "pointer-events-none absolute inset-x-3 -bottom-[7px]",
                    "h-[2px] rounded-full transition",
                    active
                      ? "bg-accent-orange shadow-[0_0_18px_rgba(242,140,27,0.55)]"
                      : "bg-transparent group-hover:bg-white/20",
                  ].join(" ")}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 rounded-2xl  px-3 py-2">
            <div
              className="
                flex h-9 w-9 items-center justify-center rounded-xl
                bg-gradient-to-b from-white/10 to-white/0
                text-base font-extrabold text-white
              "
            >
              {(user?.name || user?.username || "G").slice(0, 1).toUpperCase()}
            </div>

            <div className="leading-tight">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#b9c6e6]">
                {user?.role || "Guest"}
              </div>
              <div className="text-base font-semibold text-white">
                {user?.name || user?.username || "Guest"}
              </div>
            </div>
          </div>

         

          <button
            onClick={onLogout}
            className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            type="button"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-3 py-2 md:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold border transition",
                  active
                    ? "bg-accent-orange/15 text-[#ffd7a8] border-accent-orange/30"
                    : "bg-white/5 text-[#b9c6e6] border-white/10 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
