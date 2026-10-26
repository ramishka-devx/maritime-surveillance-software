import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { VesselProvider } from '../../context/VesselContext.jsx';

export default function AppLayout() {
  return (
    <VesselProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-surface-container-lowest text-on-surface flex select-none font-sans">
        {/* 1. Global Persistent Sidebar */}
        <Sidebar />

        {/* 2. Main Viewport Shell */}
        <div className="relative flex-1 h-full ml-60 flex flex-col overflow-hidden">
          {/* Global Persistent Header */}
          <Header sector="SECTOR 04 - COLOMBO HARBOUR APPROACH" />

          {/* 3. Page Body (Outlet) */}
          <main className="relative flex-1 w-full h-[calc(100vh-4rem)] mt-16 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </VesselProvider>
  );
}
