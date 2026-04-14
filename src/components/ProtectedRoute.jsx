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
  const { user, loading, profileLoading, profile, isAdmin, initialProfileDone } = useAuth();

  // Only show loader during initial auth + profile determination.
  // Once profile has been determined at least once, never block rendering
  // for background refreshes (prevents reload flash on tab switch).
  const isInitialLoad = loading || (!initialProfileDone && (profileLoading || (user && !profile)));

  if (isInitialLoad) {
    return (
      <div className="global-loader-container">
        <VectorLoader />
        <h2
          className="global-loader-text"
          style={{ marginTop: '0', color: '#555', fontSize: '13px' }}
        >
          {loading ? 'INITIALIZING SYSTEM...' : 'LOADING PROFILE...'}
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
