import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { VesselProvider } from '../../context/VesselContext.jsx';

export default function AppLayout() {
  return (
    <VesselProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-bs-bg text-bs-ink flex select-none font-sans">
        {/* 1. Global Persistent Sidebar */}
        <Sidebar />

        {/* 2. Main Viewport Shell */}
        <div className="relative flex-1 h-full ml-60 flex flex-col overflow-hidden">
          {/* Global Persistent Header */}
          <Header />

          {/* 3. Page Body (Outlet). Each page paints its own light background. */}
          <main className="relative flex-1 w-full h-[calc(100vh-4rem)] mt-16 overflow-hidden bg-bs-bg text-bs-ink">
            <Outlet />
          </main>
        </div>
      </div>
    </VesselProvider>
  );
}
