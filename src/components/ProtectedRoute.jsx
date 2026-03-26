import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VectorLoader from './VectorLoader';

/**
 * Wraps protected routes.
 * - While session is being determined → shows loading screen
 * - Not logged in → redirects to /login
 * - Logged in → renders children
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="global-loader-container">
        <VectorLoader />
        <h2
          className="global-loader-text"
          style={{ marginTop: '0', color: '#555', fontSize: '13px' }}
        >
          INITIALIZING SYSTEM...
        </h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
