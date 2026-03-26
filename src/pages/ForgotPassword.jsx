import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import VectorLoader from '../components/VectorLoader';
import '../styles/auth.css';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) return triggerError('Please enter your Gmail address.');

    try {
      setLoading(true);
      await resetPassword(email);
      setSuccess('Password reset link sent! Check your Gmail inbox.');
      showToast('Reset email sent!', 'success');
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
          <h1>Reset Password</h1>
          <p>We'll send a reset link to your Gmail.</p>
        </div>

        <form className="auth-form" onSubmit={handleReset}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="auth-field">
            <label>Gmail Address</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            <button className="auth-link" onClick={() => navigate('/login')}>
              ← Back to Sign In
            </button>
          </span>
          <p className="auth-brand">I-VOICE ENTERPRISE v2.0</p>
        </div>
      </div>
    </div>
  );
}
