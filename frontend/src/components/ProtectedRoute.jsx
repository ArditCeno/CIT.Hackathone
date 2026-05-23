import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute() {
  const { currentUser, authLoading } = useApp();
  if (authLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
