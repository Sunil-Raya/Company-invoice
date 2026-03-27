import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VectorLoader from './VectorLoader';
import NotAuthorized from './NotAuthorized';

/**
 * Wraps protected routes.
 * - While session is being determined → shows loading screen
 * - Not logged in → redirects to /login
 * - Not admin → shows NotAuthorized (WhatsApp contact screen)
 * - Admin → renders children
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

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

  if (!isAdmin) {
    return <NotAuthorized />;
  }

  return children;
}
