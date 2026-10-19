import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import MapPage from './pages/Map/MapPage.jsx';
import AlertsPage from './pages/Alerts/AlertsPage.jsx';
import AnomaliesPage from './pages/Anomalies/AnomaliesPage.jsx';
import RestrictedAreasPage from './pages/RestrictedAreas/RestrictedAreasPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import UsersPage from './pages/Users/UsersPage.jsx';
import RolesPermissionsPage from './pages/RolesPermissions/RolesPermissionsPage.jsx';
import DetectionSettingsPage from './pages/DetectionSettings/DetectionSettingsPage.jsx';
import SystemHealthPage from './pages/SystemHealth/SystemHealthPage.jsx';
import { isMaintenance } from './auth/roles.js';

function ProtectedRoute({ children }) {
  const { user, token, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070e1c] flex items-center justify-center text-slate-300 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">INITIALIZING SERENGUARD OPS...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isMaintenance(user) && !['/systemhealth', '/system-health', '/health'].includes(pathname.toLowerCase().replace(/\/+$/, ''))) {
    return <Navigate to="/SystemHealth" replace />;
  }
  return children;
}

export default function App() {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070e1c] flex items-center justify-center text-slate-300 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">INITIALIZING SERENGUARD OPERATION TERMINAL...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={token && user ? <Navigate to={isMaintenance(user) ? '/SystemHealth' : '/'} replace /> : <LoginPage />}
      />

      {/* Unified Protected Shell Layout (Persistent Top Bar and Sidebar for all pages) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Map Route */}
        <Route path="/" element={<MapPage />} />

        {/* Dedicated Alerts Queue Route */}
        <Route path="/Alerts" element={<AlertsPage />} />

        {/* Dedicated Anomalies Explorer Route */}
        <Route path="/Anomalies" element={<AnomaliesPage />} />

        {/* Dedicated Restricted Areas Route */}
        <Route path="/RestrictedAreas" element={<RestrictedAreasPage />} />

        {/* Dedicated Dashboard Analytics Route */}
        <Route path="/Dashboard" element={<DashboardPage />} />

        {/* Dedicated Operator Profile Route */}
        <Route path="/Profile" element={<ProfilePage />} />

        {/* Dedicated Admin User Management Route */}
        <Route path="/Users" element={<UsersPage />} />

        {/* Dedicated Admin Roles & Permissions Route */}
        <Route path="/RolesPermissions" element={<RolesPermissionsPage />} />

        {/* Dedicated Admin Detection Settings Route */}
        <Route path="/DetectionSettings" element={<DetectionSettingsPage />} />

        {/* System Health is exclusively available to Maintenance. */}
        <Route path="/SystemHealth" element={isMaintenance(user) ? <SystemHealthPage /> : <Navigate to="/" replace />} />
      </Route>

      {/* Aliased /map to / */}
      <Route path="/map" element={<Navigate to="/" replace />} />

      {/* Lowercase alias redirects */}
      <Route path="/alerts" element={<Navigate to="/Alerts" replace />} />
      <Route path="/anomalies" element={<Navigate to="/Anomalies" replace />} />
      <Route path="/restricted-areas" element={<Navigate to="/RestrictedAreas" replace />} />
      <Route path="/restricted" element={<Navigate to="/RestrictedAreas" replace />} />
      <Route path="/dashboard" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/profile" element={<Navigate to="/Profile" replace />} />
      <Route path="/my-profile" element={<Navigate to="/Profile" replace />} />
      <Route path="/users" element={<Navigate to="/Users" replace />} />
      <Route path="/roles-permissions" element={<Navigate to="/RolesPermissions" replace />} />
      <Route path="/roles" element={<Navigate to="/RolesPermissions" replace />} />
      <Route path="/detection-settings" element={<Navigate to="/DetectionSettings" replace />} />
      <Route path="/detection" element={<Navigate to="/DetectionSettings" replace />} />
      <Route path="/system-health" element={<Navigate to="/SystemHealth" replace />} />
      <Route path="/systemhealth" element={<Navigate to="/SystemHealth" replace />} />
      <Route path="/health" element={<Navigate to="/SystemHealth" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
