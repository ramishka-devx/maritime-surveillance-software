import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import SerenGuardLogo from '../images/SerenGuard.png'; // Import the logo

const SignIn = ({ onLogin, onRegister }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Operator');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = (e) => {
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

      const result = onLogin({ identifier: username, password });
      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect to dashboard after successful login
        navigate('/');
      }
      return;
    }

    // Sign up flow
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

    const result = onRegister({ name: fullName, email, username, password, role });
    if (result?.error) {
      setError(result.error);
    } else {
      // After successful signup, switch to login mode for user to sign in
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
    <div className="signin-container">
      <div className="signin-card">
        {/* Logo Header */}
        <div className="signin-header">
          <div className="logo-container">
            <img 
              src={SerenGuardLogo} 
              alt="SerenGuard Logo" 
              className="logo-image"
            />
          </div>
          <h1 className="signin-title">Secure Access Portal</h1>
        </div>

        {/* Toggle Buttons */}
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => {
              setMode('signup');
              resetMessages();
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    resetMessages();
                  }}
                >
                  <option>Operator</option>
                  <option>Supervisor</option>
                  <option>Administrator</option>
                  <option>Analyst</option>
                </select>
              </div>
            </>
          )}

          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
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
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
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
            />
          </div>

          {/* Role Field (for Login mode) */}
          {mode === 'login' && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  resetMessages();
                }}
              >
                <option>Operator</option>
                <option>Supervisor</option>
                <option>Administrator</option>
                <option>Analyst</option>
              </select>
            </div>
          )}

          {/* Confirm Password (for Signup mode) */}
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
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
              />
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="signin-button">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Footer Message */}
          <div className="signin-footer">
            <p className="security-note">
              Authorized personnel only. All access is monitored and logged.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;