import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
import VectorLoader from '../components/VectorLoader';
import '../styles/auth.css';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase embeds the token in the URL hash — we must exchange it for a session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
  }, []);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirm) return triggerError('Please fill in both fields.');
    if (password.length < 6) return triggerError('Password must be at least 6 characters.');
    if (password !== confirm) return triggerError('Passwords do not match.');

    try {
      setLoading(true);
      await updatePassword(password);
      setSuccess('Password updated! Redirecting to login…');
      showToast('Password updated!', 'success');
      setTimeout(() => navigate('/login'), 2000);
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
          <h1>New Password</h1>
          <p>Choose a strong password for your account.</p>
        </div>

        {!sessionReady && (
          <div className="auth-error">
            Invalid or expired reset link. Please request a new one.
          </div>
        )}

        <form className="auth-form" onSubmit={handleUpdate}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="auth-field">
            <label>New Password</label>
            <input
              type="password"
              name="new-password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={!sessionReady}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirm-password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              disabled={!sessionReady}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading || !sessionReady}>
            {loading ? 'Updating…' : 'Update Password'}
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
