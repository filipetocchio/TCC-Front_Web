// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este arquivo valida a lógica central de gerenciamento de estado do
 * `AuthProvider`. O foco é testar as transições de estado (login, logout)
 * e os efeitos colaterais que elas disparam (atualização do localStorage,
 * configuração do header da API).
 *
 * Estratégia de Teste:
 * 1. O módulo `@/services/api.js` é mockado para isolar o
 * Provider de chamadas de rede reais.
 * 2. Um `TestComponent` consumidor é criado para acessar o contexto
 * e disparar suas funções (`login`, `logout`).
 * 3. O `AuthProvider` é renderizado com o `TestComponent` filho.
 * 4. Os testes validam:
 * - O estado inicial (simulando falha na restauração de sessão).
 * - O fluxo de `login` e seus efeitos colaterais.
 * - O fluxo de `logout` e a limpeza do estado.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './AuthProvider.jsx';
import useAuth from '../hooks/useAuth.js';
import { axe } from 'vitest-axe';

// --- Configuração do Mock para o Módulo 'api' ---

/**
 * Configura o mock do módulo da API ('@/services/api.js').
 * O mock deve preceder a importação do AuthProvider para garantir
 * que o contexto consuma a versão mockada da API.
 * As definições são feitas dentro do factory para evitar erros de hoisting.
 */
vi.mock('@/services/api.js', () => {
  // Define o mock da instância 'api' (default export)
  const mockApi = {
    post: vi.fn(),
    defaults: {
      headers: {
        common: {
          'Authorization': null,
        },
      },
    },
  };

  // Define o mock da função 'setAuthToken' (named export)
  const mockSetAuthToken = vi.fn((token) => {
    if (token) {
      mockApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      mockApi.defaults.headers.common['Authorization'] = null;
    }
  });

  // Retorna os mocks que serão usados por 'import'
  return {
    default: mockApi,
    setAuthToken: mockSetAuthToken,
  };
});

// Importa o módulo 'api' (agora mockado)
import api from '@/services/api.js';

// --- Fim do Mock ---

// Definição de constantes de mock para os testes
const mockUser = { id: 1, nomeCompleto: 'Usuario Teste', email: 'test@example.com' };
const mockToken = 'mock.access.token';

/**
 * Componente de Teste (Consumidor de Contexto)
 *
 * Simula um componente consumidor do AuthContext. Sua finalidade
 * é obter as funções (`login`, `logout`) e o estado (`usuario`)
 * do provedor e expô-los ao teste através de botões e texto.
 */
const TestComponent = () => {
  const { usuario, login, logout } = useAuth();

  const handleLogin = () => {
    // Dispara a função 'login' do contexto com dados mockados.
    // O provider não é responsável pela chamada de API de login,
    // apenas por receber o resultado.
    login(mockUser, mockToken);
  };

  const handleLogout = async () => {
    // Dispara a função de logout do contexto.
    await logout();
  };

  return (
    <div>
      {/* Exibe o nome do usuário ou 'Visitante' com base no estado do contexto */}
      {usuario ? <span>Bem-vindo, {usuario.nomeCompleto}</span> : <span>Visitante</span>}
      {/* Botões para disparar as ações do contexto */}
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

/**
 * Função utilitária para renderização em testes.
 *
 * Envolve o componente de teste com os provedores necessários
 * (MemoryRouter, AuthProvider) para simular um ambiente
 * de aplicação funcional.
 */
const renderWithProviders = (component) => {
  return render(
    <MemoryRouter initialEntries={['/test']}>
      <AuthProvider>
        <Routes>
          <Route path="/test" element={component} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

// --- Suíte de Testes para AuthProvider ---
describe('AuthProvider', () => {

  beforeEach(() => {
    // Limpa mocks e localStorage antes de cada teste
    vi.clearAllMocks();
    localStorage.clear();

    /**
     * Configura o mock 'api.post' para o estado padrão.
     * O 'restoreSession' (do useEffect) deve falhar por padrão,
     * e o 'logout' deve ser mockado para o teste de logout.
     */
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        throw new Error('Sem sessão ativa');
      }
      if (url === '/auth/logout') {
        return { status: 200 };
      }
      return {};
    });

    // Garante que o header da API esteja limpo
    if (api.defaults) {
      api.defaults.headers.common['Authorization'] = null;
    }
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Valida se o componente atende aos padrões de acessibilidade (a11y)
   * após o carregamento inicial.
   */
  it('deve ser acessível (sem violações de a11y)', async () => {
    const { container } = renderWithProviders(<TestComponent />);
    // Aguarda o 'authLoading' (verificação de sessão) terminar
    await screen.findByText('Visitante');
    expect(await axe(container)).toHaveNoViolations();
  });

  /**
   * Valida o estado inicial do provedor.
   * O mock do 'beforeEach' faz '/auth/refresh' falhar, simulando
   * um usuário não logado.
   */
  it('deve renderizar o estado inicial (visitante)', async () => {
    // Arrange
    renderWithProviders(<TestComponent />);
    
    // Assert
    // Aguarda o 'authLoading' ser concluído e verifica o estado de visitante.
    expect(await screen.findByText('Visitante')).toBeInTheDocument();
  });

  /**
   * Valida a função 'login' e seus efeitos colaterais.
   * Garante que o estado, o localStorage e o header da API
   * são atualizados corretamente.
   */
  it('deve logar um usuário, atualizar o contexto, o localStorage e o header da API', async () => {
    
    // Arrange
    renderWithProviders(<TestComponent />);
    // Garante que o estado inicial é 'Visitante'
    await screen.findByText('Visitante');
    
    // Act
    // 'act' é utilizado para envolver a atualização de estado
    // disparada pelo clique no botão 'Login'.
    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    // Assert
    // Verificação 1 (Estado do Contexto): Aguarda a atualização do DOM.
    expect(await screen.findByText('Bem-vindo, Usuario Teste')).toBeInTheDocument();

    // Verificação 2 (LocalStorage): Confirma a persistência dos dados.
    expect(localStorage.getItem('usuario')).toEqual(JSON.stringify(mockUser));
    
    // Verificação 3 (Header da API): Confirma a configuração do token.
    expect(api.defaults.headers.common['Authorization']).toEqual(`Bearer ${mockToken}`);
  });

  /**
   * Valida a função 'logout' e seus efeitos colaterais.
   * Garante que o estado, o localStorage e o header da API
   * são limpos corretamente.
   */
  it('deve deslogar um usuário, limpar o contexto, o localStorage e o header da API', async () => {
    
    // --- Arrange ---
    // Sobrescreve o mock do 'beforeEach' para este teste.
    // Simula uma restauração de sessão ('/auth/refresh') BEM-SUCEDIDA
    // para garantir que o usuário esteja logado ANTES do logout.
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        // A resposta do refresh simula a estrutura de dados esperada
        return { data: { data: { ...mockUser, accessToken: mockToken } } };
      }
      if (url === '/auth/logout') {
        return { status: 200 };
      }
      return {};
    });

    renderWithProviders(<TestComponent />);
    
    // Aguarda o 'useEffect' (restoreSession) carregar o usuário
    await screen.findByText('Bem-vindo, Usuario Teste');

    // --- Act ---
    // Dispara a função de logout.
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    // --- Assert ---
    // Verifica se o estado do contexto foi revertido para 'Visitante'.
    expect(await screen.findByText('Visitante')).toBeInTheDocument();
    // Verifica se o localStorage foi limpo.
    expect(localStorage.getItem('usuario')).toBeNull();
    // Verifica se o header da API foi limpo.
    expect(api.defaults.headers.common['Authorization']).toBeNull();
  });
});