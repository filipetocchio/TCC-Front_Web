// Todos direitos autorais reservados pelo QOTA.

/**
 * Layout para Páginas Públicas
 *
 * Descrição:
 * Este componente serve como um layout base para todas as rotas públicas da
 * aplicação. Ele utiliza o componente <Outlet> do react-router-dom para
 * renderizar o conteúdo da rota filha correspondente.
 *
 * O principal propósito deste layout é criar um escopo de renderização separado
 * para as páginas públicas, garantindo que elas não sejam afetadas por lógicas
 * de estado ou componentes de layout destinados a páginas autenticadas (como o Sidebar).
 */
import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    // A tag <Outlet> renderiza o componente da rota filha (ex: LoginPage, RegisterUser).
    <Outlet />
  );
};

export default PublicLayout;