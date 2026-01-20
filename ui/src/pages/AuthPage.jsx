import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenGuardLogo from '../assets/SerenGuard.png';
import { useAuth } from '../auth/AuthContext.jsx';

function splitFullName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1) };
}

const SignIn = ({ onLogin, onRegister }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (mode === 'login') {
      if (!username || !password) {
        setError('Please enter your username/email and password');
        return;
      }

      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }

      const result = await onLogin({ identifier: username, password });
      if (result?.error) {
        setError(result.error);
      } else {
        navigate('/');
      }
      return;
    }

    if (!fullName || !email || !username || !password || !confirmPassword) {
      setError('Please fill out all fields to create an account');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await onRegister({
      name: fullName,
      email,
      username,
      password,
    });
    if (result?.error) {
      setError(result.error);
    } else {
      setMessage('Account created! Switching to sign in...');
      setTimeout(() => {
        setMode('login');
        setUsername(username);
        setPassword('');
        setEmail('');
        setFullName('');
        setConfirmPassword('');
        setMessage('Account created! Please sign in with your new credentials.');
      }, 1000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(53, 194, 255, 0.15), transparent 35%), radial-gradient(circle at 80% 30%, rgba(117, 247, 255, 0.12), transparent 40%), #060e1a',
      }}
    >
      <div className="w-full max-w-sm bg-gradient-to-br from-[#243b78] to-[#1a2d5a] rounded-2xl p-10 shadow-2xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={SerenGuardLogo} alt="SerenGuard Logo" className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold text-white">Secure Access Portal</h1>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2 bg-[#1e2e5a] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
              mode === 'login'
                ? 'bg-[#243b78] text-white shadow-lg'
                : 'bg-transparent text-[#9aa8c7] hover:text-white'
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
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
              mode === 'signup'
                ? 'bg-[#243b78] text-white shadow-lg'
                : 'bg-transparent text-[#9aa8c7] hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">{error}</div>
          )}
          {message && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {message}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-[#9aa8c7] uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    resetMessages();
                  }}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-[#9aa8c7] uppercase">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    resetMessages();
                  }}
                  placeholder="you@serenguard.com"
                  autoComplete="email"
                  className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
                />
              </div>

              <div className="text-xs text-[#9aa8c7] -mt-1">
                New accounts are created as <span className="font-semibold text-white">Operator</span>.
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-[#9aa8c7] uppercase">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                resetMessages();
              }}
              placeholder="Enter your username"
              autoComplete="username"
              className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[#9aa8c7] uppercase">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                resetMessages();
              }}
              placeholder="Enter your password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
            />
          </div>

          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#9aa8c7] uppercase">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  resetMessages();
                }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
              />
            </div>
          )}

          <button
            type="submit"
            className="mt-2 py-3 bg-[#f28c1b] text-white font-bold rounded-lg hover:bg-[#d97706] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="mt-4 pt-4 border-t border-[#3556a8]">
            <p className="text-xs text-[#9aa8c7] text-center leading-relaxed">
              Authorized personnel only. All access is monitored and logged.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const { login, signup } = useAuth();

  const onLogin = async ({ identifier, password }) => {
    try {
      await login({ identifier, password });
      return { ok: true };
    } catch (e) {
      return { error: e?.message || 'Login failed' };
    }
  };

  const onRegister = async ({ name, email, username, password }) => {
    try {
      const { first_name, last_name } = splitFullName(name);
      await signup({
        first_name,
        last_name,
        username,
        email,
        password,
      });
      return { ok: true };
    } catch (e) {
      return { error: e?.message || 'Registration failed' };
    }
  };

  return <SignIn onLogin={onLogin} onRegister={onRegister} />;
}
