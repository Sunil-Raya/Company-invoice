import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import VectorLoader from '../components/VectorLoader';
import '../styles/auth.css';

export default function Register() {
  const { signUpWithEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirm) return triggerError('Please fill in all fields.');
    if (!email.toLowerCase().endsWith('@gmail.com')) return triggerError('Only Gmail addresses are allowed.');
    if (password.length < 6) return triggerError('Password must be at least 6 characters.');
    if (password !== confirm) return triggerError('Passwords do not match.');

    try {
      setLoading(true);
      await signUpWithEmail(email, password);
      setSuccess('Account created! Check your Gmail inbox to confirm your email, then log in.');
      showToast('Check your email to confirm!', 'info');
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-logo"><VectorLoader /></div>

        <div className="auth-header">
          <h1>Create Account</h1>
          <p>A Gmail address is required to register.</p>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

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
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            Already have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/login')}>Sign In</button>
          </span>
          <p className="auth-brand">I-VOICE ENTERPRISE v2.0</p>
        </div>
      </div>
    </div>
  );
}
