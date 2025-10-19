// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente de Rota Protegida
 *
 * Descrição:
 * Este componente atua como um "guardião" para rotas que exigem autenticação.
 * Ele envolve as páginas privadas da aplicação e gerencia o acesso com base no
 * estado de autenticação do usuário, provido pelo `useAuth` hook.
 *
 * Fluxo de Lógica:
 * 1.  Exibe um indicador de carregamento (`loader`) enquanto o AuthProvider está
 * verificando se existe uma sessão ativa. Isso previne renderizações
 * prematuras ou "flashes" de conteúdo.
 * 2.  Se, após a verificação, o usuário não estiver autenticado, ele é
 * automaticamente redirecionado para a página de login.
 * 3.  Se o usuário estiver autenticado, o componente renderiza a página filha
 * solicitada (`children`), permitindo o acesso.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import paths from '../routes/paths';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  // --- 1. Estado de Carregamento ---
  // Enquanto a verificação inicial da sessão está em andamento, exibe um loader
  // para fornecer feedback visual ao usuário e evitar o acesso a conteúdo protegido.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  // --- 2. Estado Não Autenticado ---
  // Após o carregamento, se o usuário não estiver autenticado, ele é redirecionado
  // para a página de login, com a opção 'replace' para limpar o histórico de navegação.
  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  // --- 3. Estado Autenticado ---
  // Se a verificação for concluída e o usuário estiver autenticado, a página
  // filha (o conteúdo protegido) é renderizada normalmente.
  return children;
};

// Validação de PropTypes para garantir o uso correto do componente.
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;