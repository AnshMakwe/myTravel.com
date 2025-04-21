// src/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { userDetails, role, loading } = useAuth();

  

  if (!userDetails) {
    return <Navigate to={`/login?role=${roleRequired}`} />;
  }

  if (role !== roleRequired) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;




