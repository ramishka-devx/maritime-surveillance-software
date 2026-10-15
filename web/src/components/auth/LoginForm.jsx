import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import serenGuardLogo from '../../assets/SerenGuard.png';

export default function LoginForm() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState();
  const [password, setPassword] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [keepSession, setKeepSession] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ identifier, password });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Check your operator ID or token and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 my-auto w-full max-w-md mx-auto">
      <div className="bg-[#111A2B] rounded-lg border border-[#1F2A40] p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
        {/* Card Header: Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-xl border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/60 mb-4">
            <img
              src={serenGuardLogo}
              alt="SerenGuard Logo"
              className="w-full h-full rounded-xl object-contain filter drop-shadow"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E6EDF7]">
            Sign in to SerenGuard
          </h2>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="mb-5 rounded-md bg-red-950/40 border border-red-500/50 p-3.5 flex items-start space-x-3 transition-all" role="alert">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-red-200 uppercase tracking-wide font-mono">
                Authentication Failed
              </div>
              <div className="text-xs text-red-300/90 mt-0.5">
                {error}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 transition-colors"
              title="Dismiss alert"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Authentication Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email / Operator ID Field */}
          <div>
            <label htmlFor="operator-email" className="text-xs font-medium text-[#E6EDF7] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Operator Email</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A99B3]">
                <svg className="w-4 h-4 text-[#8A99B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="text"
                id="operator-email"
                name="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="operator@serenguard.ops"
                required
                className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-sans bg-[#09111F] border border-[#1F2A40] rounded-md text-[#E6EDF7] placeholder-[#8A99B3]/50 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors duration-150"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="operator-password" className="block text-xs font-medium text-[#E6EDF7] uppercase tracking-wider">
                Security Passcode / Token
              </label>
            </div>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A99B3]">
                <svg className="w-4 h-4 text-[#8A99B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="operator-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                required
                className="block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm font-sans bg-[#09111F] border border-[#1F2A40] rounded-md text-[#E6EDF7] placeholder-[#8A99B3]/50 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A99B3] hover:text-[#22D3EE] transition-colors focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Session Retention / Terminal Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSession}
                onChange={(e) => setKeepSession(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#09111F] border-[#1F2A40] text-cyan-400 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-[#8A99B3] select-none">Maintain active watch session</span>
            </label>
          </div>

          {/* Primary Cyan CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#22D3EE] hover:bg-cyan-300 text-[#07111E] font-semibold text-xs sm:text-sm tracking-wide rounded-md shadow-md shadow-cyan-500/25 glow-cyan-btn transition-all duration-150 flex items-center justify-center space-x-2 uppercase active:scale-[0.99] disabled:opacity-60"
            >
              <span>{submitting ? 'Authenticating Terminal...' : 'Sign In to Terminal'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1F2A40]" />
          </div>
        </div>

        {/* Text Link: "Forgot password? Contact your administrator" */}
        <div className="text-center">
          <a href="#admin-contact" className="text-xs text-[#8A99B3] hover:text-[#22D3EE] transition-colors font-medium inline-flex items-center space-x-1">
            <span>Forgot password? Contact your administrator</span>
            <svg className="w-3 h-3 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

      </div>
    </div>
  );
}
