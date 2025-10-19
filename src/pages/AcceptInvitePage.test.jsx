// Todos direitos autorais reservados pelo QOTA.

/**
 * Suite de Testes para a Página AcceptInvitePage
 *
 * Descrição:
 * Este arquivo contém os testes de integração para o componente AcceptInvitePage.
 * O objetivo é garantir que o componente renderize os estados corretos (carregando,
 * erro, sucesso com diferentes CTAs) com base na resposta da API e no estado de
 * autenticação do usuário.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcceptInvitePage from './AcceptInvitePage';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// Mock do serviço de API centralizado.
vi.mock('../services/api');

/**
 * Componente wrapper para prover o contexto e o roteador necessários para a página.
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

describe('Testes de Integração: AcceptInvitePage', () => {

  it('Deve exibir o indicador de carregamento inicialmente', () => {
    // Arrange
    // Simula uma API que ainda não respondeu.
    api.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });

    // Assert
    // Usamos 'querySelector' para encontrar o elemento pela sua classe de animação.
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('Deve exibir uma mensagem de erro para um token inválido', async () => {
    // Arrange
    api.get.mockRejectedValue({
      response: { data: { message: 'Convite expirado.' } },
    });
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Convite Inválido')).toBeInTheDocument();
      expect(screen.getByText('Convite expirado.')).toBeInTheDocument();
    });
  });

  it('Deve exibir os detalhes e o botão "Criar Conta" para um novo usuário', async () => {
    // Arrange
    api.get.mockResolvedValue({
      data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'novo@qota.com', numeroDeFracoes: 2, userExists: false }},
    });
    renderWithProviders(<AcceptInvitePage />, { providerProps: { usuario: null } });
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      const paragraph = screen.getByText((content) => content.includes('recebendo') && content.includes('fração(ões)'));
      expect(paragraph).toBeInTheDocument();
      expect(screen.getByText('Criar Conta para Aceitar')).toBeInTheDocument();
    });
  });

  it('Deve exibir os detalhes e o botão "Fazer Login" para um usuário existente', async () => {
    // Arrange
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

  it('Deve exibir os detalhes e o botão "Aceitar Convite" para um usuário já logado', async () => {
    // Arrange
    api.get.mockResolvedValue({
      data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'logado@qota.com', numeroDeFracoes: 5, userExists: true }},
    });
    const providerProps = { usuario: { id: 1, email: 'logado@qota.com' } };
    renderWithProviders(<AcceptInvitePage />, { providerProps });
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      expect(screen.getByText('Aceitar Convite')).toBeInTheDocument();
    });
  });
});