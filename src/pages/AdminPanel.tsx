import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminFixed from './AdminFixed';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
      <AdminFixed />
    </ErrorBoundary>
  );
};

export default AdminPanel;
