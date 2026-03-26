import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import VectorLoader from '../components/VectorLoader';
import '../styles/auth.css';

// Google "G" logo SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function Login() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Redirect happens via Supabase OAuth callback — no manual nav needed
    } catch (err) {
      triggerError(err.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return triggerError('Please fill in all fields.');
    try {
      setLoading(true);
      setError('');
      await signInWithEmail(email, password);
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      triggerError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-logo"><VectorLoader /></div>

        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access the I-Voice ledger.</p>
        </div>

        {/* Google */}
        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Email + password */}
        <form className="auth-form" onSubmit={handleEmailLogin}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label>Gmail Address</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            <button className="auth-link" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </button>
          </span>
          <span>
            Don't have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/register')}>
              Register
            </button>
          </span>
          <p className="auth-brand">I-VOICE ENTERPRISE v2.0</p>
        </div>
      </div>
    </div>
  );
}
