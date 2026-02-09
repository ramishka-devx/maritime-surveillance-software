import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import SignIn from './components/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alerts from './pages/Alerts.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

const ACCOUNTS_KEY = 'serenguard.accounts';
const SESSION_KEY = 'serenguard.session';

const defaultAccounts = [
  {
    name: 'Commander Jane',
    email: 'jane@serenguard.io',
    username: 'commander',
    password: 'maritime123',
    role: 'Admin',
  },
];

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [accounts, setAccounts] = usePersistedState(ACCOUNTS_KEY, defaultAccounts);
  const [session, setSession] = usePersistedState(SESSION_KEY, null);
  const [error, setError] = useState('');

  const isAuthed = Boolean(session);

  const handleRegister = (payload) => {
    const exists = accounts.some((acct) => acct.username.toLowerCase() === payload.username.toLowerCase());
    if (exists) {
      return { error: 'Username already exists.' };
    }
    const updated = [...accounts, payload];
    setAccounts(updated);
    setSession({ username: payload.username, name: payload.name, role: payload.role, email: payload.email });
    return { success: true };
  };

  const handleLogin = ({ identifier, password, username }) => {
    const user = identifier || username;
    const match = accounts.find(
      (acct) => acct.username.toLowerCase() === user.toLowerCase() && acct.password === password,
    );
    if (!match) {
      return { error: 'Invalid credentials.' };
    }
    setSession({ username: match.username, name: match.name, role: match.role, email: match.email });
    return { success: true };
  };

  const handleLogout = () => {
    setSession(null);
    navigate('/auth');
  };

  useEffect(() => {
    if (!isAuthed && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [isAuthed, location.pathname, navigate]);

  const navLinks = useMemo(
    () => [
      { label: 'Dashboard', to: '/' },
      { label: 'Alerts', to: '/alerts' },
      { label: 'Reports', to: '/reports' },
      { label: 'Settings', to: '/settings' },
    ],
    [],
  );

  const Protected = ({ children }) => {
    if (!isAuthed) return <Navigate to="/auth" replace />;
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar user={session} links={navLinks} onLogout={handleLogout} />
        <main style={{ padding: '20px 32px 40px' }}>{children}</main>
      </div>
    );
  };

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          isAuthed ? (
            <Navigate to="/" replace />
          ) : (
            <SignIn onRegister={handleRegister} onLogin={handleLogin} error={error} setError={setError} />
          )
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard user={session} />
          </Protected>
        }
      />
      <Route
        path="/alerts"
        element={
          <Protected>
            <Alerts />
          </Protected>
        }
      />
      <Route
        path="/reports"
        element={
          <Protected>
            <Reports />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <Settings user={session} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to={isAuthed ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default App;
