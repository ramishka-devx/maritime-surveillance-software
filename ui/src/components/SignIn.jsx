import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenGuardLogo from '../assets/SerenGuard.png';
import LoginImage from '../assets/login.png';
import { useAuth } from '../auth/AuthContext.jsx';

function splitFullName(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { first_name: '', last_name: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  };
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0b74c9] focus:ring-4 focus:ring-[#0b74c9]/15';

const SignIn = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (mode === 'login') {
      try {
        if (!username || !password) {
          setError('Please enter your username/email and password');
          return;
        }

        await login({ identifier: username, password });
        navigate('/');
      } catch (e) {
        setError(e?.message || 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!fullName || !email || !username || !password || !confirmPassword) {
      setError('Please fill out all fields');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const { first_name, last_name } = splitFullName(fullName);
      await signup({ first_name, last_name, username, email, password });
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setEmail('');
    } catch (e) {
      setError(e?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#d0d9e7] via-[#073b5f] to-[#0b74c9] flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        <div className="hidden lg:flex relative">
          <img
            src={LoginImage}
            alt="Login"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#073b5f]/60" />

          <div className="relative z-10 px-8 py-8 flex flex-col justify-between text-white w-full">
            <div>
              <h1 className="text-4xl font-bold mb-5 leading-tight">
                Real-time visibility.<br />
                Smarter decisions.
              </h1>

              <div className="w-14 h-1 bg-[#f59e0b] mb-6 rounded-full" />

              <p className="text-base text-slate-200 max-w-md">
                Advanced analytics and monitoring for modern maritime operations.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm max-w-md">
              <p className="font-semibold">Connected. Monitored. Optimized.</p>
              <p className="text-sm text-slate-200">
                Empowering fleets with actionable insights.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center px-6 py-8 bg-[#f9fbfd] overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <div className="text-center mb-5">
              <img
                src={SerenGuardLogo}
                alt="SerenGuard Logo"
                className="w-16 h-16 object-contain mx-auto mb-2 rounded-lg"
              />
              <h1 className="text-2xl font-bold text-[#08244a]">SerenGuard</h1>
              <p className="text-sm text-gray-500">Maritime Intelligence</p>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1 mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                }}
                className={`py-2 rounded-md text-sm transition ${
                  mode === 'login'
                    ? 'bg-white text-[#0b74c9] font-bold shadow-sm'
                    : 'text-gray-500 hover:text-[#0b74c9]'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  resetMessages();
                }}
                className={`py-2 rounded-md text-sm transition ${
                  mode === 'signup'
                    ? 'bg-white text-[#0b74c9] font-bold shadow-sm'
                    : 'text-gray-500 hover:text-[#0b74c9]'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-semibold text-green-700">
                  {message}
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      resetMessages();
                    }}
                    className={inputClass}
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      resetMessages();
                    }}
                    className={inputClass}
                  />
                </>
              )}

              <input
                type="text"
                placeholder={mode === 'login' ? 'Email / Username' : 'Username'}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  resetMessages();
                }}
                className={inputClass}
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    resetMessages();
                  }}
                  className={`${inputClass} pr-14`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 hover:text-[#0b74c9]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {mode === 'signup' && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    resetMessages();
                  }}
                  className={inputClass}
                />
              )}

              {mode === 'login' && (
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-[#0b74c9]"
                    />
                    Remember Me
                  </label>

                  <button
                    type="button"
                    className="font-semibold text-[#0b74c9] hover:text-[#064f9e]"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-[#0b74c9] to-[#064f9e] py-3 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition hover:from-[#0967b3] hover:to-[#043f82] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Login to Dashboard'
                    : 'Create Account'}
              </button>

        

              <p className="pt-1 text-center text-xs text-slate-500">
                Need help?{' '}
                <span className="font-bold text-[#0b74c9] cursor-pointer">
                  Contact Administrator
                </span>
              </p>

              <p className="text-center text-[11px] text-slate-400">
                Authorized personnel only. All access is monitored and logged.
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignIn;