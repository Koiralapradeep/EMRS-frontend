import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/authContext';

const PrivateRoutes = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('PrivateRoutes: Loading user state...');
    return <div>Loading...</div>;
  }

  if (!user) {
    console.warn('User not authenticated. Redirecting to /login.');
    return <Navigate to="/login" />;
  }

  console.log('User authenticated. Access granted.');
  return children;
};

export default PrivateRoutes;