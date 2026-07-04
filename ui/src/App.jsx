import React, { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import SignIn from './components/SignIn.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import Alerts from './pages/Alerts/index.jsx';
import Reports from './pages/Reports/index.jsx';
import Settings from './pages/Settings/index.jsx';
import Permissions from './pages/Permissions/index.jsx';
import Help from './pages/Help/index.jsx';
import RequestAccessGate from './components/RequestAccessGate.jsx';
import { useAuth } from './auth/AuthContext.jsx';

function titleCase(str) {
  return String(str || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRoleName(roles) {
  const list = Array.isArray(roles) ? roles : [];
  if (list.some((r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1)) return 'Super Admin';

  const first = list[0];
  const name = typeof first === 'string' ? first : first?.name;
  if (!name) return 'User';
  return titleCase(String(name).replaceAll('_', ' '));
}

function ProtectedLayout({ isAuthed, session, navLinks, onLogout, children }) {
  if (!isAuthed) return <Navigate to="/auth" replace />;
  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={session} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const { token, user, roles, isLoading, logout } = useAuth();
  const isAuthed = Boolean(token && user);
  const canAdmin = useMemo(
    () =>
      Boolean(
        user?.role_id === 1 ||
          (Array.isArray(roles) ? roles : []).some(
            (r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1,
          ),
      ),
    [roles, user?.role_id],
  );

  const session = useMemo(() => {
    if (!user) return null;
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
    return {
      ...user,
      name,
      role: formatRoleName(roles),
    };
  }, [user, roles]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  useEffect(() => {
    if (!isLoading && !isAuthed && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [isAuthed, isLoading, location.pathname, navigate]);

  const navLinks = useMemo(() => {
    const base = [
      { label: 'Dashboard', to: '/' },
      { label: 'Alerts', to: '/alerts' },
      { label: 'Reports', to: '/reports' },
      { label: 'Settings', to: '/settings' },
    ];
    if (canAdmin) base.splice(3, 0, { label: 'Users', to: '/permissions' });
    return base;
  }, [canAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-text-muted shadow-card">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          isAuthed ? (
            <Navigate to="/" replace />
          ) : (
            <SignIn />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <RequestAccessGate permission="dashboard.view" featureName="Dashboard">
              <Dashboard user={session} />
            </RequestAccessGate>
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <RequestAccessGate permission="alert.view" featureName="Alerts">
              <Alerts />
            </RequestAccessGate>
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts/:id"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <RequestAccessGate permission="alerts.list" featureName="Alerts">
              <Alerts />
            </RequestAccessGate>
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <RequestAccessGate permission="reports.view" featureName="Reports">
              <Reports />
            </RequestAccessGate>
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <Settings user={session} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/permissions"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <Permissions />
          </ProtectedLayout>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <Help />
          </ProtectedLayout>
        }
      />
      <Route
        path="/alert/:id"
        element={
          <ProtectedLayout
            isAuthed={isAuthed}
            session={session}
            navLinks={navLinks}
            onLogout={handleLogout}
          >
            <Dashboard user={session} />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to={isAuthed ? '/' : '/auth'} replace />} />
    </Routes>
  );
}
