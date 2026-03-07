import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export function ProtectedRoute() {
  const location = useLocation();
  const { session, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="shell shell--centered">
        <div className="card card--ghost">
          <p className="eyebrow">Loading</p>
          <h1>Restoring your session.</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth" />;
  }

  return <Outlet />;
}
