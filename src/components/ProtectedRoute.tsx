import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, LogOut, ShieldAlert } from 'lucide-react';

export function ProtectedRoute({ allowedRoles = [] }: { allowedRoles?: string[] }) {
  const { user, role, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
