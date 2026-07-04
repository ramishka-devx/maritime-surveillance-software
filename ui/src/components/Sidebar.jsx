import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Anchor, Bell, FileText, Shield, Settings, HelpCircle, Ship, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import SerenGuardLogo from "../assets/SerenGuard.png";
import { useAuth } from "../auth/AuthContext.jsx";

const topLinks = [
  { label: "FLEET OVERVIEW", to: "/", icon: Ship },
  { label: "ALERTS", to: "/alerts", icon: Bell },
  { label: "REPORTS", to: "/reports", icon: FileText },
  { label: "PERMISSIONS", to: "/permissions", icon: Shield },
];

const bottomLinks = [
  { label: "SETTINGS", to: "/settings", icon: Settings },
  { label: "LOGOUT", action: "logout", icon: LogOut },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user, roles } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const canAdmin = Boolean(
    user?.role_id === 1 ||
      (Array.isArray(roles) ? roles : []).some(
        (r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1,
      ),
  );

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const renderLink = (link) => {
    const active = pathname === link.to;
    const Icon = link.icon;
    
    const className = `flex items-center px-6 py-3 mx-2 text-sm font-bold tracking-wide transition-colors relative overflow-hidden ${
      !isExpanded ? "justify-center px-0" : ""
    } ${
      active
        ? "bg-[#F28C1B] text-white rounded-lg"
        : "text-[#b9c6e6] hover:bg-white/5 hover:text-white hover:rounded-lg"
    }`;

    const innerContent = (
      <>
        <Icon size={isExpanded ? 18 : 22} className={`flex-shrink-0 transition-all duration-300 ${active ? "text-white" : "text-[#b9c6e6]"}`} />
        <span 
          className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isExpanded ? "w-[150px] opacity-100 ml-4 text-left" : "w-0 opacity-0 ml-0"
          }`}
        >
          {link.label}
        </span>
      </>
    );

    if (link.action === "logout") {
      return (
        <button
          key={link.label}
          onClick={handleLogout}
          title={!isExpanded ? link.label : undefined}
          className={`${className} w-[calc(100%-1rem)]`}
        >
          {innerContent}
        </button>
      );
    }

    return (
      <Link
        key={link.to}
        to={link.to}
        title={!isExpanded ? link.label : undefined}
        className={className}
      >
        {innerContent}
      </Link>
    );
  };

  return (
    <aside 
      className={`${isExpanded ? "w-[240px]" : "w-[70px]"} h-screen bg-[#1b397e] flex flex-col shrink-0 text-white transition-all duration-300 relative z-20`}
    >
      {/* Collapse Button (Only visible when expanded) */}
      {isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-4 text-[#b9c6e6] hover:text-white transition-colors z-50"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Logo Section */}
      <div 
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`flex flex-col items-center pt-8 pb-10 transition-all duration-300 overflow-hidden ${!isExpanded ? "px-2 cursor-pointer group" : "px-6"}`}
        title={!isExpanded ? "Expand Sidebar" : undefined}
      >
        <div className={`${isExpanded ? "w-16 h-16" : "w-10 h-10 group-hover:scale-110 group-hover:shadow-xl"} bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg transition-all duration-300 flex-shrink-0`}>
          <img src={SerenGuardLogo} alt="SerenGuard" className={`${isExpanded ? "w-14 h-14 rounded-lg" : "w-8 h-8 rounded-lg"} object-contain transition-all duration-300`} />
        </div>
        <div className={`flex flex-col items-center transition-all duration-300 ${isExpanded ? "h-[50px] opacity-100" : "h-0 opacity-0"}`}>
          <h1 className="text-[#F28C1B] text-2xl font-extrabold tracking-wide whitespace-nowrap">
            SerenGuard
          </h1>
          <p className="text-[#b9c6e6] text-xs font-semibold mt-1 whitespace-nowrap">Admin Panel</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {topLinks.filter(link => link.to !== '/permissions' || canAdmin).map(renderLink)}
      </nav>

      {/* Bottom Links */}
      <div className="pb-6 flex flex-col gap-1 overflow-x-hidden flex-shrink-0">
        <div className={`h-px bg-white/10 my-4 transition-all duration-300 ${isExpanded ? "mx-6" : "mx-4"}`}></div>
        {bottomLinks.map(renderLink)}
      </div>
    </aside>
  );
}
