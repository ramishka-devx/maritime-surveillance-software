import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Search, Bell, HelpCircle } from "lucide-react";

export function Topbar({ user }) {
  const { pathname } = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTitle = () => {
    switch (pathname) {
      case "/": return "Welcome to Maritime Domain!";
      case "/alerts": return "Alerts Management";
      case "/reports": return "Reports";
      case "/permissions": return "Permissions & Access Control";
      case "/settings": return "Settings";
      case "/help": return "Help & Documentation";
      default: return "Maritime Domain";
    }
  };

  return (
    <header className="h-[72px] bg-[#1b397e] w-full border-b border-gray-200 flex items-center justify-between px-7 shrink-0">
      {/* Search Input */}
      <div className="flex items-center">
        <div className="relative flex items-center w-[400px]">
          <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        
        <div className="flex items-center gap-6 text-white">
          <button className="relative hover:text-[#F28C1B] transition-colors">
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <Link to="/help" className="hover:text-[#F28C1B] transition-colors">
            <HelpCircle size={22} />
          </Link>
        </div>

        {/* User Profile */}
        <div className="relative flex items-center gap-3 ml-2" ref={dropdownRef}>
          <button 
            className="focus:outline-none focus:ring-2 focus:ring-[#F28C1B] rounded-full"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.first_name || user?.name || "Admin"}&background=0D8ABC&color=fff`} 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border-2 border-white/20 hover:border-[#F28C1B] transition-colors"
            />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-4 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col items-center border-b border-gray-100 pb-4 mb-2">
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.first_name || user?.name || "Admin"}&background=0D8ABC&color=fff&size=64`} 
                  alt="User" 
                  className="w-16 h-16 rounded-full object-cover mb-3 shadow-sm border border-gray-100"
                />
                <h3 className="text-gray-800 font-extrabold text-sm text-center">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.name || "Administrator"}
                </h3>
                <p className="text-gray-500 font-semibold text-xs text-center mt-0.5">
                  {user?.email || "admin@maritime.com"}
                </p>
                <div className="mt-2 inline-flex items-center justify-center px-2 py-1 bg-[#1b397e]/10 text-[#1b397e] rounded font-bold text-[10px] uppercase tracking-wide">
                  {user?.role || "System Admin"}
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-1">
                <a href="/settings" className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-center border border-transparent hover:border-gray-200">
                  Manage Account
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
