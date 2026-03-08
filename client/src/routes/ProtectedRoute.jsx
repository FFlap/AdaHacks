import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export function ProtectedRoute() {
  const location = useLocation();
  const { session, status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth" />;
  }

  return <Outlet />;
}
