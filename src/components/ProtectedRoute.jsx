import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import paths from '../routes/paths';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  // 1. Enquanto o AuthProvider estiver verificando a sessão, exibe um loader.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  // 2. Após o carregamento, se não estiver autenticado, redireciona.
  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  // 3. Se estiver autenticado, renderiza a página solicitada.
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;