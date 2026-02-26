import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenGuardLogo from '../assets/SerenGuard.png';
import loginVideo from '../assets/video1.mp4';
import { useAuth } from '../auth/AuthContext.jsx';

function splitFullName(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { first_name: '', last_name: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

const SignIn = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setError('Please fill out all fields to create an account');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
    } catch (e) {
      setError(e?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={loginVideo} type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="w-full max-w-sm bg-gradient-to-br from-[#243b78]/90 to-[#1a2d5a]/90 rounded-2xl p-10 shadow-2xl backdrop-blur-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={SerenGuardLogo} alt="SerenGuard Logo" className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold text-white">Secure Access Portal</h1>
        </div>

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
          {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">{error}</div>}
          {message && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{message}</div>}

          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-[#9aa8c7] uppercase">Full Name</label>
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
                <label htmlFor="email" className="text-xs font-semibold text-[#9aa8c7] uppercase">Email</label>
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
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-[#9aa8c7] uppercase">Username</label>
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
            <label htmlFor="password" className="text-xs font-semibold text-[#9aa8c7] uppercase">Password</label>
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
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#9aa8c7] uppercase">Confirm Password</label>
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
            disabled={isSubmitting}
            className="mt-2 py-3 bg-[#f28c1b] text-white font-bold rounded-lg hover:bg-[#d97706] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
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

export default SignIn;
