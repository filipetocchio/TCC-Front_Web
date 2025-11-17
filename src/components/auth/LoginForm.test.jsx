// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este arquivo valida o fluxo completo de login do usuário, cobrindo:
 * 1. Renderização inicial e acessibilidade.
 * 2. O fluxo de sucesso (autenticação, atualização de contexto,
 * armazenamento local e redirecionamento).
 * 3. O fluxo de falha (exibição de erro da API).
 * 4. Validação de campos nativa do HTML5.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';

// --- Configuração do Mock para o Módulo 'api' ---

/**
 * Configura o mock do módulo da API ('@/services/api.js').
 * O mock deve preceder a importação de componentes (ex: AuthProvider)
 * para garantir que eles consumam a versão mockada da API.
 * As definições dos mocks são feitas dentro do factory para
 * evitar erros de hoisting e garantir o escopo correto.
 */
vi.mock('@/services/api.js', () => {
  const mockApi = {
    post: vi.fn(),
    defaults: {
      headers: { common: { 'Authorization': null } },
    },
  };
  const mockSetAuthToken = vi.fn((token) => {
    if (token) {
      mockApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      mockApi.defaults.headers.common['Authorization'] = null;
    }
  });
  return {
    default: mockApi,
    setAuthToken: mockSetAuthToken,
  };
});

// Importa a instância mockada da API.
import api from '@/services/api.js';
// --- Fim do Mock ---

// Importa os componentes após a configuração dos mocks.
import AuthProvider from '@/context/AuthProvider.jsx'; 
import LoginForm from '@/components/auth/LoginForm.jsx'; 

// Mock do serviço de notificações (react-hot-toast).
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

/**
 * Função utilitária para renderização em testes.
 *
 * Envolve o componente de teste com os provedores necessários
 * (MemoryRouter, AuthProvider) para simular um ambiente
 * de aplicação funcional.
 *
 * @param {React.ReactElement} component O componente a ser renderizado.
 * @returns {RenderResult} O resultado da renderização do Testing Library.
 */
const renderWithProviders = (component) => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={component} />
          <Route path="/home" element={<span>Página Home (Mock)</span>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

// --- Suíte de Testes de Integração: LoginForm ---
describe('LoginForm', () => {
  const mockUser = { id: 1, nomeCompleto: 'Usuario Teste', email: 'test@example.com' };
  const mockToken = 'mock.access.token';

  // Reseta os mocks e o estado antes de cada teste.
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Configura uma implementação padrão para o mock da API.
    // O refresh deve falhar por padrão nos testes de login.
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        throw new Error('Sem sessão ativa');
      }
      return {};
    });

    // Garante que o header de autorização esteja limpo.
    if (api.defaults) {
      api.defaults.headers.common['Authorization'] = null;
    }
  });

  // Limpa o localStorage após cada teste.
  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Valida se o componente atende aos padrões de acessibilidade (a11y)
   * utilizando o 'vitest-axe'.
   */
  it('deve ser acessível (sem violações de a11y)', async () => {
    const { container } = renderWithProviders(<LoginForm />);
    // Aguarda a renderização completa do formulário.
    await screen.findByRole('button', { name: /Entrar/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  /**
   * Valida a renderização inicial do formulário, garantindo que
   * todos os campos de entrada e o botão de submissão estão presentes.
   */
  it('deve renderizar os campos de e-mail, senha e o botão de login', async () => {
    renderWithProviders(<LoginForm />);
    // Aguarda o estado de 'authLoading' do provider ser resolvido.
    await screen.findByRole('button', { name: /Entrar/i });
    
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeEnabled();
  });

  /**
   * Testa o fluxo de login bem-sucedido.
   * Valida a chamada de API, o redirecionamento e os efeitos colaterais
   * (localStorage, AuthContext e header da API).
   */
  it('deve logar com sucesso, salvar no localStorage e navegar para a home', async () => {
    // --- Arrange ---
    // Configura o mock da API para simular uma resposta de login bem-sucedida,
    // garantindo que o 'accessToken' esteja aninhado conforme a lógica
    // de desestruturação do componente (loginResponse.data.data).
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/login') {
        return {
          data: {
            data: {
              ...mockUser,
              accessToken: mockToken,
            },
          },
        };
      }
      if (url === '/auth/refresh') {
        throw new Error('Sem sessão ativa');
      }
      return {};
    });

    renderWithProviders(<LoginForm />);
    
    const loginButton = await screen.findByRole('button', { name: /Entrar/i });
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);

    // --- Act ---
    // Simula a interação do usuário preenchendo o formulário e clicando em "Entrar".
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // --- Assert ---
    // 1. Aguarda o resultado final e visível: o redirecionamento para a Home.
    // 'findByText' aguarda internamente o ciclo assíncrono (API, setState, navigate).
    expect(await screen.findByText('Página Home (Mock)')).toBeInTheDocument();

    // 2. Após o fluxo ser concluído, valida todos os efeitos colaterais.
    // Verifica se a API foi chamada com os dados corretos.
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    
    // Verifica se os dados do usuário foram persistidos no localStorage.
    expect(localStorage.getItem('usuario')).toEqual(JSON.stringify(mockUser));
    
    // Verifica se o token foi configurado corretamente no header da API (via AuthContext).
    expect(api.defaults.headers.common['Authorization']).toEqual(`Bearer ${mockToken}`);

    // Verifica se o formulário de login desapareceu da tela.
    expect(screen.queryByRole('button', { name: /Entrar/i })).toBeNull();
  });

  /**
   * Testa o fluxo de falha na autenticação (ex: senha incorreta).
   * Valida a exibição da mensagem de erro e a persistência do formulário.
   */
  it('deve exibir uma mensagem de erro se a API retornar um erro 401', async () => {
    // --- Arrange ---
    // Configura o mock da API para simular uma falha (throw) na autenticação.
    const apiError = {
      response: { data: { message: 'E-mail ou senha inválidos. Verifique suas credenciais.' } },
    };
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/login') {
        throw apiError;
      }
      if (url === '/auth/refresh') {
        throw new Error('Sem sessão ativa');
      }
      return {};
    });

    renderWithProviders(<LoginForm />);
    
    const loginButton = await screen.findByRole('button', { name: /Entrar/i });
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);

    // --- Act ---
    // O 'act' é usado aqui para agrupar as atualizações de estado
    // que ocorrem após a falha da API (ex: 'setStatusMessage').
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
    });

    // --- Assert ---
    // Valida se a mensagem de erro retornada pela API foi exibida ao usuário.
    expect(await screen.findByText(apiError.response.data.message)).toBeInTheDocument();
    // Garante que o botão de login está habilitado para nova tentativa.
    expect(await screen.findByRole('button', { name: /Entrar/i })).toBeEnabled();
    // Garante que nenhum dado de usuário foi salvo no localStorage.
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  /**
   * Testa a validação nativa (HTML5) do navegador para campos obrigatórios.
   */
  it('deve exibir erros de validação do HTML5 se os campos estiverem vazios', async () => {
    // --- Arrange ---
    renderWithProviders(<LoginForm />);
    
    const loginButton = await screen.findByRole('button', { name: /Entrar/i });
    const emailInput = screen.getByLabelText(/Email/i);

    vi.clearAllMocks();

    // --- Act ---
    // Simula o clique no botão de submissão com o formulário vazio.
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // --- Assert ---
    // Verifica se o navegador marcou o campo de e-mail como inválido.
    expect(emailInput.validity.valid).toBe(false);
    // Garante que nenhuma chamada à API foi realizada.
    expect(api.post).not.toHaveBeenCalled();
  });
});