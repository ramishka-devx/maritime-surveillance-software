import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { isSuperAdmin } from '../auth/roles.js';
import Navbar from './Navbar.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const links = [{ label: 'Dashboard', to: '/dashboard' }];
  if (superAdmin) links.push({ label: 'Admin Panel', to: '/dashboard?tab=admin' });

  return (
    <div className="min-h-screen bg-[#060e1a]">
      <Navbar user={user} links={links} onLogout={logout} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
