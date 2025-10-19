// Todos direitos autorais reservados pelo QOTA.

/**
 * Hook Customizado - useAuth
 *
 * Descrição:
 * Este arquivo define o hook customizado `useAuth`, que serve como um atalho
 * para consumir o `AuthContext` em qualquer componente da aplicação.
 *
 *
 * @returns {object} O valor completo do contexto de autenticação, incluindo
 * o usuário, token, status de autenticação e as funções de login/logout.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  // Retorna o valor provido pelo AuthContext.Provider mais próximo na árvore de componentes.
  return useContext(AuthContext);
};

export default useAuth;