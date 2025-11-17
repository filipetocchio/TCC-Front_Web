// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este arquivo contém os testes de integração para o componente AcceptInvitePage.
 * O objetivo é garantir que o componente renderize os estados corretos (carregando,
 * erro, sucesso com diferentes CTAs) com base na resposta da API e no estado de
 * autenticação do usuário.
 *
 * Execução:
 * Este arquivo é projetado para ser executado através da suíte de testes
 * padrão do Vitest (ex: `npm test` ou `vitest`).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcceptInvitePage from './AcceptInvitePage';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// Configura o mock para o módulo de API centralizado.
vi.mock('../services/api');

/**
 * Componente wrapper utilitário para renderização em testes.
 *
 * Prover o `AuthContext` e o `MemoryRouter` necessários para que o
 * componente `AcceptInvitePage` possa ser renderizado isoladamente
 * durante a execução do teste de integração.
 *
 * @param {React.ReactElement} ui O componente a ser renderizado.
 * @param {object} options Opções de renderização.
 * @param {object} options.providerProps Propriedades para o AuthContext.
 * @param {string} options.route A rota inicial (ex: /convite/token).
 * @returns {RenderResult} O resultado da renderização do Testing Library.
 */
const renderWithProviders = (ui, { providerProps, route = '/convite/fake-token' }) => {
  return render(
    <AuthContext.Provider value={providerProps}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/convite/:token" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

// --- Suíte de Testes de Integração ---
describe('Testes de Integração: AcceptInvitePage', () => {

  /**
   * Valida se o indicador de carregamento (spinner) é exibido
   * enquanto a requisição à API está pendente.
   */
  it('Deve exibir o indicador de carregamento inicialmente', () => {
    // Arrange
    // Simula uma API que ainda não respondeu, mantendo a Promise pendente.
    api.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });

    // Assert
    //  'querySelector' para encontrar o elemento pela sua classe de animação.
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  /**
   * Valida se a página exibe a mensagem de erro correta quando a API
   * rejeita o token (ex: convite expirado ou inválido).
   */
  it('Deve exibir uma mensagem de erro para um token inválido', async () => {
    // Arrange
    // Simula uma resposta de erro da API.
    api.get.mockRejectedValue({
      response: { data: { message: 'Convite expirado.' } },
    });
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });
    
    // Assert
    // Aguarda a atualização de estado e a renderização da mensagem de erro.
    await waitFor(() => {
      expect(screen.getByText('Convite Inválido')).toBeInTheDocument();
      expect(screen.getByText('Convite expirado.')).toBeInTheDocument();
    });
  });

  /**
   * Valida o fluxo para um novo usuário (não existente no banco de dados).
   * A página deve exibir os detalhes do convite e o CTA "Criar Conta".
   */
  it('Deve exibir os detalhes e o botão "Criar Conta" para um novo usuário', async () => {
    // Arrange
    // Simula uma resposta de sucesso da API indicando que o usuário não existe.
    api.get.mockResolvedValue({
      data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'novo@qota.com', numeroDeFracoes: 2, userExists: false }},
    });
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });
    
    // Assert
    // Aguarda a renderização dos detalhes e do botão de ação correto.
    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      const paragraph = screen.getByText((content) => content.includes('recebendo') && content.includes('fração(ões)'));
      expect(paragraph).toBeInTheDocument();
      expect(screen.getByText('Criar Conta para Aceitar')).toBeInTheDocument();
    });
  });

  /**
   * Valida o fluxo para um usuário já cadastrado, mas não logado.
   * A página deve exibir os detalhes e o CTA "Fazer Login".
   */
  it('Deve exibir os detalhes e o botão "Fazer Login" para um usuário existente', async () => {
    // Arrange
    // Simula uma resposta de sucesso da API indicando que o usuário já existe.
    api.get.mockResolvedValue({
      data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'existente@qota.com', numeroDeFracoes: 1, userExists: true }},
    });
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      expect(screen.getByText('Fazer Login para Aceitar')).toBeInTheDocument();
    });
  });

  /**
   * Valida o fluxo principal de sucesso, onde um usuário já autenticado
   * acessa a página de convite.
   */
  it('Deve exibir os detalhes e o botão "Aceitar Convite" para um usuário já logado', async () => {
    // Arrange
    // Simula uma resposta de sucesso da API.
    api.get.mockResolvedValue({
      data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'logado@qota.com', numeroDeFracoes: 5, userExists: true }},
    });
    // Simula o estado de autenticação através do provider.
    const providerProps = { usuario: { id: 1, email: 'logado@qota.com' } };
    renderWithProviders(<AcceptInvitePage />, { providerProps });
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      expect(screen.getByText('Aceitar Convite')).toBeInTheDocument();
    });
  });
});