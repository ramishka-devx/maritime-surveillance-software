import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Roles } from '../auth/roles.js';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(Roles.OPERATOR);
  const [adminSecret, setAdminSecret] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        admin_registration_secret: adminSecret,
      });

      if (role === Roles.SUPER_ADMIN) {
        setSuccess('Super Admin account created. You can now sign in.');
      } else {
        setSuccess('Account created. Please wait for Super Admin verification before you can sign in.');
      }
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.message || 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border rounded-xl p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Create account</div>
        <div className="mt-1 text-sm text-slate-600">
          Operator accounts require Super Admin verification.
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm font-medium text-slate-700">First name</div>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-700">Last name</div>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm font-medium text-slate-700">Email</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-700">Role</div>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value={Roles.OPERATOR}>Operator</option>
              <option value={Roles.SUPER_ADMIN}>Super Admin</option>
            </select>
          </label>

          {role === Roles.SUPER_ADMIN && (
            <label className="block">
              <div className="text-sm font-medium text-slate-700">Super Admin registration code</div>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                required
                type="password"
                autoComplete="off"
              />
              <div className="mt-1 text-xs text-slate-500">
                This is required to prevent public Super Admin signups.
              </div>
            </label>
          )}

          <label className="block">
            <div className="text-sm font-medium text-slate-700">Password</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            className="w-full rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>

          <div className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="text-slate-900 underline" to="/login">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
