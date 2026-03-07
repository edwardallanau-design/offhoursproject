import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, roleHomeRoute } from './AuthContext';
import type { UserRole } from '../types';

interface Props {
  allowedRole: UserRole;
}

export const ProtectedRoute = ({ allowedRole }: Props) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to={roleHomeRoute[user.role]} replace />;

  return <Outlet />;
};
