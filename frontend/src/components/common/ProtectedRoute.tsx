import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isGuest, guestSession } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // 1. Registered authenticated user has access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 2. Active guest session can only access their specific trip
  if (isGuest && guestSession) {
    const isGuestTripRoute = location.pathname.startsWith(`/trips/${guestSession.tripId}`);
    if (isGuestTripRoute) {
      return <>{children}</>;
    }
    // Guest isolation: redirect out of registered-only routes to their active trip
    return <Navigate to={`/trips/${guestSession.tripId}`} replace />;
  }

  // 3. Unauthenticated visitor redirected to login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

