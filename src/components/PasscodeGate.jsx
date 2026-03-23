import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import VectorLoader from './VectorLoader';
import '../styles/passcode-gate.css';

const PasscodeGate = ({ children }) => {
  const { isAuthenticated, login } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const { showToast } = useToast();

  if (isAuthenticated) {
    return children;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(passcode)) {
      showToast('Welcome Back!', 'success');
    } else {
      setError(true);
      setPasscode('');
      showToast('Invalid Passcode', 'error');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="passcode-gate-container">
      <div className={`passcode-card ${error ? 'shake' : ''}`}>
        <div className="passcode-header">
          <div className="logo-section">
            <VectorLoader />
          </div>
          <h1>System Lock</h1>
          <p>Security validation required to access the ledger.</p>
        </div>

        <form onSubmit={handleSubmit} className="passcode-form">
          <div className="passcode-input-wrapper">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••"
              autoFocus
              maxLength={4}
            />
          </div>
          <button type="submit" className="login-button">
            Authenticate
          </button>
        </form>

        <div className="passcode-footer">
          <p>I-VOICE ENTERPRISE v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default PasscodeGate;
