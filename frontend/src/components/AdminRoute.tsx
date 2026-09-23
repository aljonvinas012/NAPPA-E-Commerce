import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Checking access..." />;
  if (!user) return <Navigate to="/login" replace />;
  // Role is verified client-side purely for navigation/UX. The real
  // authorization check happens on every admin API endpoint (adminOnly
  // middleware) — this only stops a customer from viewing admin pages.
  if (user.role !== 'admin') return <Navigate to="/shop" replace />;
  return <>{children}</>;
};

export default AdminRoute;
