import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/authContext';

const RoleBasedRoute = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('RoleBasedRoute: Loading user state...');
    return <div>Loading...</div>;
  }

  if (!user) {
    console.warn('No user found. Redirecting to /login.');
    return <Navigate to="/login" />;
  }

  if (!requiredRoles.includes(user.role)) {
    console.warn('Unauthorized access attempt detected.');
    return <Navigate to="/unauthorized" />;
  }

  console.log('Role-based access granted.');
  return children;
};

export default RoleBasedRoute;