import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { isSuperAdmin } from '../auth/roles.js';

function NavItem({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'block rounded-md px-3 py-2 text-sm',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="font-semibold text-slate-900">
            Maritime Surveillance
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:block text-xs text-slate-600">
                <span className="font-medium text-slate-900">
                  {user.first_name} {user.last_name}
                </span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  {user.role || `role_id:${user.role_id}`}
                </span>
              </div>
            )}
            <button
              className="text-sm rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
              onClick={logout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-white border rounded-lg p-3 h-fit">
          <div className="text-xs font-semibold text-slate-500 px-2 py-2">Navigation</div>
          <nav className="space-y-1">
            <NavItem to="/dashboard" end>
              Dashboard
            </NavItem>
            {superAdmin && <NavItem to="/dashboard?tab=admin">Admin panel</NavItem>}
          </nav>

          <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-700">RBAC</div>
            <div className="mt-1">Operator: operations + triage</div>
            <div>Super admin: full access</div>
          </div>
        </aside>

        <main className="bg-white border rounded-lg p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
