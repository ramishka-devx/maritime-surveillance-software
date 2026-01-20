import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = useMemo(() => location.state?.from?.pathname || '/dashboard', [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border rounded-xl p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Sign in</div>
        <div className="mt-1 text-sm text-slate-600">Operator & Super Admin access</div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-medium text-slate-700">Email</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              type="email"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-700">Password</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              type="password"
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            className="w-full rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-sm text-slate-600">
            New operator?{' '}
            <Link className="text-slate-900 underline" to="/signup">
              Create an account
            </Link>
          </div>

          <div className="mt-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            Seeded users (dev):
            <div className="mt-1 font-mono">admin@seranguard.local / Admin123!</div>
            <div className="font-mono">operator@seranguard.local / Operator123!</div>
          </div>
        </form>
      </div>
    </div>
  );
}
