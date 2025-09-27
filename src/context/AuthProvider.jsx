import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthContext';
// Todos direitos autorais reservados pelo QOTA.

/**
 * AuthProvider
 *
 * Componente responsável por prover o contexto de autenticação para a aplicação.
 * Armazena e gerencia o usuário autenticado e o token de acesso.
 */
const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); // Estado para dados do usuário autenticado
  const [token, setToken] = useState(null);     // Estado para o token JWT

  /**
   * Efeito responsável por sincronizar os dados de autenticação com o localStorage.
   * Também escuta eventos 'storage' para manter múltiplas abas sincronizadas.
   */
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('accessToken');

      if (storedUser && storedToken) {
        setUsuario(JSON.parse(storedUser));
        setToken(storedToken);
      }
    };

    // Ouvinte para mudanças no localStorage (ex: logout em outra aba)
    window.addEventListener('storage', handleStorageChange);

    // Verificação inicial ao montar o componente
    handleStorageChange();

    // Cleanup ao desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * login
   *
   * Atualiza o estado de autenticação e salva os dados no localStorage.
   * @param {Object} usuario - Objeto do usuário autenticado
   * @param {string} token - Token JWT recebido após autenticação
   */
  const login = (usuario, token) => {
    setUsuario(usuario);
    setToken(token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('accessToken', token); // Padronização do nome da chave
  };

  /**
   * logout
   *
   * Limpa o estado de autenticação e remove os dados do localStorage.
   */
  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('accessToken');
    // Mensagem de sucesso poderia ser emitida por Toast ou Context de UI, se necessário
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        isAuthenticated: !!token, // Valor booleano indicando se o usuário está autenticado
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
