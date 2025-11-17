// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este componente é o pilar central do gerenciamento de estado de
 * autenticação em toda a aplicação. Ele utiliza a Context API do React
 * para encapsular a lógica de autenticação e fornecer dados e ações
 * (como 'login', 'logout') para componentes filhos.
 *
 * Fluxo de Lógica:
 * 1.  Estado Interno: Gerencia 'usuario', 'token' e 'authLoading'.
 * 2.  Restaurar Sessão (useEffect): Ao montar, tenta autenticar o usuário
 * silenciosamente via endpoint '/auth/refresh'. O estado 'authLoading'
 * previne o acesso a rotas protegidas antes desta verificação.
 * 3.  Função 'login': Recebe dados do usuário e token, atualiza o estado
 * interno, persiste os dados do usuário no localStorage e configura o
 * header 'Authorization' para futuras requisições da API.
 * 4.  Função 'logout': Notifica o backend (via '/auth/logout'), limpa o
 * estado, o localStorage e o header da API.
 * 5.  Otimização: Utiliza 'useCallback' e 'useMemo' para otimizar o
 * desempenho e evitar renderizações desnecessárias nos componentes
 * consumidores.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthContext';

// Importa a instância da API e o configurador de token.
import api, { setAuthToken } from '@/services/api.js';

const AuthProvider = ({ children }) => {
  // --- 1. Gerenciamento de Estado Interno ---

  // 'usuario': Armazena os dados do usuário logado (ex: nome, e-mail).
  const [usuario, setUsuario] = useState(null);
  // 'token': Armazena o accessToken JWT.
  const [token, setToken] = useState(null);
  
  // 'authLoading': Estado de carregamento para a verificação inicial da sessão.
  // Essencial para 'ProtectedRoutes' (Rotas Protegidas).
  const [authLoading, setAuthLoading] = useState(true);

  /**
   * Efeito de inicialização (montagem) para restaurar a sessão do usuário.
   * Tenta obter um novo accessToken usando o refresh token (via cookie httpOnly).
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Tenta renovar a sessão no backend.
        const response = await api.post('/auth/refresh');
        // Desestrutura a resposta (conforme padrão da API).
        const { accessToken, ...userData } = response.data.data;
        
        // Se bem-sucedido, aplica os dados do usuário e token.
        // A função 'login' é definida com useCallback, sendo segura de usar aqui.
        login(userData, accessToken);
      } catch (error) {
        // Falha esperada (ex: sem sessão ativa, token expirado).
        // O usuário permanece como 'null' (não autenticado).
      } finally {
        // Indica que a verificação inicial terminou.
        // Isso libera o 'ProtectedRoute' para tomar a decisão de redirecionamento.
        setAuthLoading(false);
      }
    };
    
    restoreSession();
    // O array de dependências vazio garante que este efeito
    // execute apenas uma vez, na montagem do componente.
  }, []); // 'login' é estável devido ao useCallback, não sendo necessário como dependência.

  /**
   * Realiza o login do usuário.
   * Atualiza o estado global e persiste os dados de sessão.
   * O 'useCallback' é usado para garantir que a referência da função
   * seja estável para os consumidores do contexto.
   *
   * @param {object} usuarioData Dados do usuário (id, nome, etc.)
   * @param {string} tokenData O accessToken JWT.
   */
  const login = useCallback((usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
    
    // Persiste os dados do usuário no localStorage para
    // acesso rápido (ex: exibição do nome em recarregamentos).
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    
    // Configura o token de autorização para todas as
    // futuras requisições da instância 'api'.
    setAuthToken(tokenData);
  }, []);

  /**
   * Realiza o logout do usuário.
   * Limpa o estado global, o armazenamento local e notifica o backend.
   * O 'useCallback' memoriza a função.
   */
  const logout = useCallback(async () => {
    try {
      // Notifica o backend para invalidar o refresh token (prática de segurança).
      await api.post('/auth/logout');
    } catch (error) {
      // Registra o erro, mas prossegue com a limpeza local
      // para garantir que o usuário seja deslogado na interface.
      console.error("Falha ao notificar o servidor sobre o logout:", error);
    } finally {
      // Limpa todos os dados de sessão, independentemente
      // do sucesso da chamada de API.
      setUsuario(null);
      setToken(null);
      localStorage.removeItem('usuario');
      setAuthToken(null);
    }
  }, []);

  /**
   * Atualiza os dados do usuário no estado global e no armazenamento local.
   * Útil para (por exemplo) atualizar o perfil do usuário
   * sem exigir um novo login.
   *
   * @param {object} newUserData Novos dados a serem mesclados
   * com o estado atual do usuário.
   */
  const updateUser = useCallback((newUserData) => {
    setUsuario((currentUser) => {
      const updatedUser = { ...currentUser, ...newUserData };
      // Atualiza também o localStorage.
      localStorage.setItem('usuario', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  /**
   * Otimização de performance (useMemo).
   * Memoriza o objeto de valor do contexto. O objeto só será
   * recriado se um dos valores no array de dependências mudar.
   * Isso previne renderizações desnecessárias em todos os
   * componentes que consomem este contexto.
   */
  const contextValue = useMemo(() => ({
    usuario,
    token,
    // Cria um booleano 'isAuthenticated' derivado do 'token'.
    isAuthenticated: !!token,
    authLoading,
    login,
    logout,
    updateUser,
  }), [usuario, token, authLoading, login, logout, updateUser]);

  // Fornece o valor memorizado para todos os componentes filhos.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Validação de PropTypes para garantir o uso correto do componente.
AuthProvider.propTypes = {
  /**
   * O conteúdo da aplicação (ex: rotas) que
   * deve ter acesso ao contexto de autenticação.
   */
  children: PropTypes.node.isRequired,
};

export default AuthProvider;