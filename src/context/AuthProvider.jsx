// Todos direitos autorais reservados pelo QOTA.

/**
 * Provedor de Autenticação
 *
 * Descrição:
 * Este arquivo define o `AuthProvider`, um componente de ordem superior (HOC) que
 * utiliza o Context API do React para gerenciar e prover o estado de autenticação
 * para toda a aplicação.
 *
 * Responsabilidades:
 * 1.  Manter o estado do usuário autenticado (`usuario`) e do token de acesso (`token`).
 * 2.  Tentar restaurar a sessão de um usuário ao carregar a aplicação, utilizando
 * o endpoint de refresh token.
 * 3.  Fornecer um estado de carregamento (`authLoading`) para evitar renderizações
 * em estados inconsistentes enquanto a sessão é verificada.
 * 4.  Expor métodos para `login`, `logout` e `updateUser` que manipulam o estado
 * global e o armazenamento local.
 * 5.  Otimizar a performance através de `useMemo` e `useCallback` para evitar
 * re-renderizações desnecessárias nos componentes consumidores.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthContext';
import api, { setAuthToken } from '../services/api';

const AuthProvider = ({ children }) => {
  // --- Gerenciamento de Estado ---
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  // `authLoading` é usado para a verificação inicial da sessão.
  const [authLoading, setAuthLoading] = useState(true);

  /**
   * Efeito para restaurar a sessão do usuário ao inicializar a aplicação.
   * Ele tenta obter um novo access token a partir do refresh token (cookie httpOnly).
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken, ...userData } = response.data.data;
        // Se a restauração for bem-sucedida, realiza o login.
        login(userData, accessToken);
      } catch (error) {
        // Uma falha aqui é esperada se não houver sessão ativa.
        // O console.log não é necessário, pois este é um fluxo normal.
      } finally {
        // Marca a verificação inicial como concluída.
        setAuthLoading(false);
      }
    };
    
    restoreSession();
  }, []); // O array vazio garante que este efeito rode apenas uma vez.

  /**
   * Realiza o login do usuário, atualizando o estado global e o armazenamento local.
   */
  const login = useCallback((usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
    // Persiste os dados do usuário no localStorage para fácil acesso.
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    // Configura o token de autorização para todas as futuras requisições da API.
    setAuthToken(tokenData);
  }, []);

  /**
   * Realiza o logout do usuário, limpando o estado global, o armazenamento local
   * e notificando o servidor para invalidar o refresh token.
   */
  const logout = useCallback(async () => {
    try {
      // Notifica o backend para invalidar o refresh token, aumentando a segurança.
      await api.post('/auth/logout');
    } catch (error) {
      // A falha na chamada da API não deve impedir o logout no frontend.
      console.error("Falha ao notificar o servidor sobre o logout:", error);
    } finally {
      // Limpa todos os dados de sessão do estado e do armazenamento local.
      setUsuario(null);
      setToken(null);
      localStorage.removeItem('usuario');
      setAuthToken(null);
    }
  }, []);

  /**
   * Atualiza os dados do usuário no estado global e no armazenamento local.
   * Utilizado, por exemplo, após a edição do perfil.
   */
  const updateUser = useCallback((newUserData) => {
    setUsuario((currentUser) => {
      const updatedUser = { ...currentUser, ...newUserData };
      localStorage.setItem('usuario', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  /**
   * Memoriza o valor do contexto para otimizar a performance.
   * O objeto de contexto só será recriado se uma de suas dependências mudar,
   * evitando re-renderizações desnecessárias nos componentes consumidores.
   */
  const contextValue = useMemo(() => ({
    usuario,
    token,
    isAuthenticated: !!token,
    authLoading,
    login,
    logout,
    updateUser,
  }), [usuario, token, authLoading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Validação de PropTypes para garantir o uso correto do componente.
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;