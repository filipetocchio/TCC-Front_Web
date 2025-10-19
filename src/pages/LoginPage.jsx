// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Login
 *
 * Descrição:
 * Este arquivo define o componente de página para a rota de login.
 *
 * A sua principal responsabilidade é atuar como um "container" ou "wrapper" para
 * o componente `LoginForm`, que contém toda a lógica de negócio e a interface
 * do formulário de autenticação.
 *
 */
import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;