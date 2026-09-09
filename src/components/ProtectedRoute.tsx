import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/api';
export function ProtectedRoute({ roles }: { roles?: Role[] }): JSX.Element {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
