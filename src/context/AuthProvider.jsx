// Todos direitos autorais reservados pelo QOTA.

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthContext';
import api, { setAuthToken } from '../services/api';

const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.post('/auth/refresh'); 
        const { accessToken, ...userData } = response.data.data;
        login(userData, accessToken);
      } catch (error) {
        console.log("Nenhuma sessão ativa encontrada para restaurar.");
      } finally {
        setAuthLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  const login = (usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    setAuthToken(tokenData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Falha ao notificar o servidor sobre o logout:", error);
    } finally {
      setUsuario(null);
      setToken(null);
      localStorage.removeItem('usuario');
      setAuthToken(null);
    }
  };

  const updateUser = (newUserData) => {
    setUsuario(newUserData);
    localStorage.setItem('usuario', JSON.stringify(newUserData));
  };

  const contextValue = {
    usuario,
    token,
    isAuthenticated: !!token,
    authLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;