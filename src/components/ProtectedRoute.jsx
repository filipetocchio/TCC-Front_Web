import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import paths from '../routes/paths';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
