import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'auth_token';
const PERMISSIONS_STORAGE_KEY = 'user_permissions';
const ROLES_STORAGE_KEY = 'user_roles';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [roles, setRoles] = useState(() => {
    try {
      const stored = localStorage.getItem(ROLES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(nextToken) {
    const t = nextToken ?? token;
    if (!t) {
      setUser(null);
      setPermissions([]);
      setRoles([]);
      return;
    }

    const profile = await apiRequest('/api/users/me', { token: t });
    setUser(profile);
    
    // Store permissions and roles from profile (returned by /me endpoint)
    if (profile?.permissions) {
      setPermissions(profile.permissions);
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(profile.permissions));
    }
    if (profile?.roles) {
      setRoles(profile.roles);
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(profile.roles));
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (token) await loadProfile(token);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
          localStorage.removeItem(ROLES_STORAGE_KEY);
          setToken(null);
          setUser(null);
          setPermissions([]);
          setRoles([]);
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

  async function signup({ first_name, last_name, username, email, password }) {
    await apiRequest('/api/users/register', {
      method: 'POST',
      body: { first_name, last_name, username, email, password },
    });
  }

  async function loginWithIdentifier({ identifier, password }) {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body: { identifier, password },
    });

    const nextToken = data?.token;
    if (!nextToken) throw new Error('Login did not return a token');

    // Store token
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    
    // Store permissions and roles from login response
    if (data?.permissions) {
      setPermissions(data.permissions);
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(data.permissions));
    }
    if (data?.roles) {
      setRoles(data.roles);
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(data.roles));
    }
    
    await loadProfile(nextToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    localStorage.removeItem(ROLES_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setPermissions([]);
    setRoles([]);
  }

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name (e.g., 'users.list')
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    // Super admin has all permissions
    if (roles.some((r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1)) {
      return true;
    }
    return permissions.includes(permission);
  }, [permissions, roles]);

  /**
   * Check if user has any of the specified permissions (OR logic)
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback((permissionList) => {
    // Super admin has all permissions
    if (roles.some((r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1)) {
      return true;
    }
    return permissionList.some(p => permissions.includes(p));
  }, [permissions, roles]);

  /**
   * Check if user has all specified permissions (AND logic)
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback((permissionList) => {
    // Super admin has all permissions
    if (roles.some((r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1)) {
      return true;
    }
    return permissionList.every(p => permissions.includes(p));
  }, [permissions, roles]);

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role name (e.g., 'admin')
   * @returns {boolean}
   */
  const hasRole = useCallback((roleName) => {
    return roles.some((r) => r === roleName || r?.name === roleName);
  }, [roles]);

  /**
   * Check if user is a super admin
   * @returns {boolean}
   */
  const isSuperAdmin = useCallback(() => {
    return roles.some((r) => r === 'super_admin' || r?.name === 'super_admin' || r?.role_id === 1);
  }, [roles]);

  const value = useMemo(
    () => ({
      token,
      user,
      permissions,
      roles,
      isLoading,
      login: loginWithIdentifier,
      signup,
      logout,
      refresh: () => loadProfile(),
      // Permission helpers
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      isSuperAdmin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, permissions, roles, isLoading, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
