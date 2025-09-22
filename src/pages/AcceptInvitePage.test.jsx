/**
 * @file AcceptInvitePage.test.jsx
 * @description Suíte de testes para o componente AcceptInvitePage.
 * Garante que o componente renderize os estados corretos (loading, erro, sucesso)
 * com base na resposta da API.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import AcceptInvitePage from './AcceptInvitePage';
import { AuthContext } from '../context/AuthContext';

// Mock da API Axios para controlar as respostas nos testes
vi.mock('axios');

// Componente wrapper para prover o contexto necessário para a página
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

describe('Component Test: AcceptInvitePage', () => {
  const providerProps = { usuario: null, token: null };

  it('should display an error message for an invalid token', async () => {
    // Configura o mock do Axios para simular uma falha na API
    axios.get.mockRejectedValue({
      response: { data: { message: 'Convite inválido ou já utilizado.' } },
    });

    renderWithProviders(<AcceptInvitePage />, { providerProps });

    // Espera até que a mensagem de erro apareça na tela
    await waitFor(() => {
      expect(screen.getByText('Convite Inválido')).toBeInTheDocument();
      expect(screen.getByText('Convite inválido ou já utilizado.')).toBeInTheDocument();
    });
  });

  it('should display invite details and "Create Account" button for a valid token if user does not exist', async () => {
    // Configura o mock do Axios para simular um convite válido para um novo usuário
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          propriedade: 'Casa de Praia',
          convidadoPor: 'Filipe Tocchio',
          emailConvidado: 'novo@qota.com',
          userExists: false,
        },
      },
    });

    renderWithProviders(<AcceptInvitePage />, { providerProps });

    await waitFor(() => {
      expect(screen.getByText('Você foi convidado!')).toBeInTheDocument();
      expect(screen.getByText(/convidou você \(novo@qota.com\)/)).toBeInTheDocument();
      // Verifica se o botão correto (Criar Conta) é renderizado
      expect(screen.getByText('Criar Conta para Aceitar')).toBeInTheDocument();
    });
  });
});