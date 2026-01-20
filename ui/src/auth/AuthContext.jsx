import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(nextToken) {
    const t = nextToken ?? token;
    if (!t) {
      setUser(null);
      return;
    }

    const profile = await apiRequest('/api/users/me', { token: t });
    setUser(profile);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (token) await loadProfile(token);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login({ email, password }) {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body: { email, password },
    });

    const nextToken = data?.token;
    if (!nextToken) throw new Error('Login did not return a token');

    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    await loadProfile(nextToken);
  }

  async function signup({ first_name, last_name, email, password, role, admin_registration_secret }) {
    await apiRequest('/api/users/register', {
      method: 'POST',
      body: { first_name, last_name, email, password, role, admin_registration_secret },
    });
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, isLoading, login, signup, logout, refresh: () => loadProfile() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
