// Todos direitos autorais reservados pelo QOTA.

/**
 * Este teste valida se o guardião de rotas está corretamente
 * bloqueando, permitindo ou aguardando o usuário com base
 * nos três estados do AuthContext (loading, authenticated, unauthenticated).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import useAuth from '../hooks/useAuth';
import { axe } from 'vitest-axe';

// Informa ao Vitest para usar o mock 
vi.mock('../hooks/useAuth.js');

/**
 * Componentes "dummy" (falsos) para simular as páginas
 * para onde o usuário deve ou não ser redirecionado.
 */
const PaginaProtegidaMock = () => <div>Página Protegida</div>;
const PaginaLoginMock = () => <div>Página de Login</div>;

/**
 * Wrapper de renderização que simula o ambiente de rotas.
 */
const renderWithRouter = (initialRoute = '/protegida') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        {/* A rota de login para onde o usuário será redirecionado se falhar */}
        <Route path="/login" element={<PaginaLoginMock />} />
        
        {/* A rota protegida */}
        <Route 
          path="/protegida" 
          element={
            <ProtectedRoute>
              <PaginaProtegidaMock />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </MemoryRouter>
  );
};

// --- Suíte de Testes para ProtectedRoute ---
describe('ProtectedRoute', () => {

  beforeEach(() => {
    // Limpa o mock antes de cada teste
    vi.mocked(useAuth).mockClear();
  });

  // Teste 1: Estado de Carregamento 
  it('deve renderizar o spinner de carregamento enquanto authLoading for true', async () => {
    // Arrange
    // Força o mock do useAuth a retornar o estado de "carregando"
    vi.mocked(useAuth).mockReturnValue({
      authLoading: true,
      isAuthenticated: false,
    });

    const { container } = renderWithRouter();

    // Assert
    // Verifica se o spinner (identificado pela classe 'animate-spin'
    // que vimos no log de erro) está presente no documento.
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    
    // Garante que o conteúdo protegido NÃO é renderizado
    expect(screen.queryByText('Página Protegida')).toBeNull();
    // Garante que o redirecionamento NÃO ocorreu
    expect(screen.queryByText('Página de Login')).toBeNull();
  });

  // Teste 2: Estado Autenticado
  it('deve renderizar o componente filho (children) se o usuário estiver autenticado', async () => {
    // Arrange
    // Força o mock do useAuth a retornar o estado de "autenticado"
    vi.mocked(useAuth).mockReturnValue({
      authLoading: false,
      isAuthenticated: true,
      usuario: { id: 1, nome: 'Teste' } // Adiciona um usuário mock
    });

    renderWithRouter();

    // Assert
    // Espera (await) para garantir que o componente foi renderizado
    expect(await screen.findByText('Página Protegida')).toBeInTheDocument();
    expect(screen.queryByText('Página de Login')).toBeNull();
  });

  // Teste 3: Estado Não Autenticado
  it('deve redirecionar para a página de login se o usuário não estiver autenticado', async () => {
    // Arrange
    // Força o mock do useAuth a retornar o estado de "deslogado"
    vi.mocked(useAuth).mockReturnValue({
      authLoading: false,
      isAuthenticated: false,
    });

    renderWithRouter();

    // Assert
    // Espera (await) o redirecionamento (efeito colateral do <Navigate>)
    expect(await screen.findByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Página Protegida')).toBeNull();
  });

  // Teste de Acessibilidade 
  it('deve ser acessível no estado autenticado', async () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      authLoading: false,
      isAuthenticated: true,
      usuario: { id: 1, nome: 'Teste' }
    });

    const { container } = renderWithRouter();
    await screen.findByText('Página Protegida');

    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });
});