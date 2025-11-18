// Todos direitos autorais reservados pelo QOTA.

/**
 * Descrição:
 * Este arquivo valida a renderização inicial da página do calendário
 * e o fluxo principal de criação de reserva. Os testes garantem que:
 * 1. A página renderiza os saldos de diárias (Atual e Futuro) corretamente.
 * 2. O modal de reserva é aberto ao selecionar uma data.
 * 3. O saldo correto (Atual vs. Futuro) é usado para validação
 * com base no ano da reserva.
 * 4. A chamada de API para criar a reserva é feita com os dados corretos.
 *
 * Estratégia de Mock:
 * - O 'AuthProvider' é real, mas a API que ele usa é mockada.
 * - 'react-router-dom' é mockado para fornecer 'useParams'.
 * - 'react-big-calendar' é mockado para simular cliques de data.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from '../context/AuthProvider.jsx';
import CalendarPage from './CalendarPage.jsx';
import api from '../services/api';
import { axe } from 'vitest-axe';

// --- Configuração de Mocks ---

// Mock da API (usando caminho relativo, igual ao componente)
vi.mock('../services/api');

// Mock do 'react-hot-toast' (default import)
// O componente 'CalendarPage' usa 'import toast from ...' (default import)
// Portanto, o mock DEVE retornar um objeto com a chave 'default'.
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  // Exporta o Toaster como um componente vazio
  Toaster: () => <div data-testid="mock-toaster" />,
}));

vi.mock('@/components/layout/Sidebar.jsx', () => ({
  
  default: ({ collapsed, ...restProps }) => { 

    return <div data-testid="mock-sidebar" {...restProps} />; 
  }
}));


vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    // O componente usa "const { id: propertyId } = useParams()"
    // Portanto, o mock DEVE fornecer a chave "id".
    useParams: vi.fn(() => ({ id: '1' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Mock do react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ onSelectSlot }) => (
    <div data-testid="mock-calendar">
      <button onClick={() => onSelectSlot({ start: new Date('2025-10-10T10:00:00Z'), end: new Date('2025-10-11T10:00:00Z') })}>
        Simular Clique Ano Atual
      </button>
      <button onClick={() => onSelectSlot({ start: new Date('2026-02-10T10:00:00Z'), end: new Date('2026-02-11T10:00:00Z') })}>
        Simular Clique Próximo Ano
      </button>
    </div>
  ),
  dateFnsLocalizer: vi.fn(() => ({})),
}));

// Mock do date-fns/locale
vi.mock('date-fns/locale/pt-BR', () => ({
  default: {},
}));

// --- Fim dos Mocks ---

// --- Mock de Data do Sistema ---
// Fixa o 'hoje' para '15 de Janeiro de 2025' para os testes
vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

// --- Dados Mockados ---
const mockUser = { id: 1, nomeCompleto: 'Usuario Teste' };
const mockPropertyData = {
  nomePropriedade: 'Casa de Praia Teste',
  // Regras de negócio mockadas para validação do modal
  duracaoMinimaEstadia: 1,
  duracaoMaximaEstadia: 15,
  usuarios: [
    {
      id: 100,
      idUsuario: 1,
      permissao: 'proprietario_comum',
      numeroDeFracoes: 1,
      saldoDiariasAtual: 10,
      saldoDiariasFuturo: 20,
      usuario: mockUser
    }
  ]
};
const mockReservations = [
  { id: 1, dataInicio: '2025-03-01T14:00:00Z', dataFim: '2025-03-05T10:00:00Z', usuario: { nomeCompleto: 'Outro Usuario' } }
];

/**
 * Função utilitária para renderização em testes.
 * Envolve o componente com os provedores (Router, Auth)
 * necessários para a execução.
 */
const renderWithProviders = () => {
  return render(
    <MemoryRouter initialEntries={['/calendario/1']}>
      <AuthProvider>
        <Routes>
          <Route path="/calendario/:propertyId" element={<CalendarPage />} />
          <Route path="/login" element={<span>Página de Login</span>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

// --- Suíte de Testes para CalendarPage ---
describe('CalendarPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem('usuario', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock.token');

    // Configuração dos Mocks da API
    api.post.mockImplementation(async (url) => {
      // Mock do AuthProvider (restoreSession)
      if (url === '/auth/refresh') {
        return { data: { data: { ...mockUser, accessToken: 'mock.token' } } };
      }
      if (url === '/calendar/reservation') {
        return { data: { success: true, message: 'Reserva criada' } };
      }
      return {};
    });

    // Mock das chamadas GET que a página faz no 'fetchData'
    api.get.mockImplementation(async (url) => {
      if (url.startsWith('/property/1')) {
        return { data: { data: mockPropertyData } };
      }
      if (url.startsWith('/calendar/property/1?')) {
        return { data: { data: mockReservations } };
      }
      if (url.startsWith('/calendar/property/1/penalties')) {
        return { data: { data: { penalties: [] } } };
      }
      if (url.startsWith('/calendar/property/1/upcoming')) {
        return { data: { data: { reservations: [] } } };
      }
      if (url.startsWith('/calendar/property/1/completed')) {
        return { data: { data: { reservations: [] } } };
      }
      return {};
    });
  });

  /**
   * Valida se o componente atende aos padrões de acessibilidade (a11y)
   */
  it('deve ser acessível (sem violações de a11y)', async () => {
    const { container } = renderWithProviders();

    // Aguarda a ÚLTIMA atualização de estado (setLoading(false))
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Saldo 2025:')).toBeInTheDocument(); // Verifica se o saldo está lá
    expect(await axe(container)).toHaveNoViolations();
  });
  
  /**
   * Valida a renderização inicial da página,
   * garantindo que os saldos (Atual e Futuro) são exibidos.
   */
  it('deve renderizar o calendário e os saldos de diárias (Atual e Futuro)', async () => {
    renderWithProviders();

    // Verifica se os saldos do mock (10 e 20) estão na tela
    expect(await screen.findByText('10')).toBeInTheDocument(); // Saldo Atual
    expect(screen.getByText('Saldo 2026:')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // Saldo Futuro

    // Verifica se o calendário mockado foi renderizado
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
  });

  /**
   * Testa o fluxo de criação de reserva para o ano corrente (2025),
   * validando a lógica de exibição do saldo 'Atual'.
   */
  it('deve criar uma reserva no ANO ATUAL e validar com o saldoDiariasAtual', async () => {
    renderWithProviders();
    await screen.findByText('Saldo 2025:');

    // Act 1: Simula o clique no calendário
    await act(async () => {
      fireEvent.click(screen.getByText('Simular Clique Ano Atual'));
    });

    // Assert 1: Modal abriu (Passo 1)
    const nextButtonStep1 = await screen.findByRole('button', { name: "Próximo" });
    expect(nextButtonStep1).toBeInTheDocument();

    // Act 2: Simula a seleção de datas
    const endDateInput = screen.getByLabelText(/Data de Fim/i);
    await act(async () => {
      fireEvent.change(endDateInput, { target: { value: '2025-10-15' } });
    });

    // Avança para o Passo 2
    await act(async () => {
      fireEvent.click(nextButtonStep1);
    });

    // Act 3: No Passo 2, preenche os hóspedes e avança
    const hospedesInput = screen.getByLabelText(/Número de Hóspedes/i);
    await act(async () => {
      fireEvent.change(hospedesInput, { target: { value: '2' } });
      fireEvent.click(screen.getByRole('button', { name: "Próximo" }));
    });

    // Assert 3: No Passo 3, verifica o resumo
    expect(await screen.findByText('Confirme sua Reserva')).toBeInTheDocument();
    expect(screen.getByText('10/10/2025')).toBeInTheDocument(); // Data Início

    // Valida se o saldo correto (Atual) está sendo exibido
    expect(screen.getByText('Saldo 2025 (Atual):')).toBeInTheDocument();
    expect(screen.getByText('10 dias')).toBeInTheDocument();

    // Act 4: Clica em Confirmar
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "Confirmar Reserva" }));
    });

    // Assert 4: Valida a chamada de API
    expect(api.post).toHaveBeenCalledWith('/calendar/reservation', expect.objectContaining({
      idPropriedade: 1,
      dataInicio: '2025-10-10T12:00:00.000Z', // Normalizado pelo componente
      dataFim: '2025-10-15T12:00:00.000Z',
      numeroHospedes: 2,
    }));
  });

  /**
   * Testa o fluxo de criação de reserva para o próximo ano (2026),
   * validando a lógica de exibição do saldo 'Futuro'.
   */
  it('deve criar uma reserva no PRÓXIMO ANO e exibir o saldoDiariasFuturo', async () => {
    renderWithProviders();
    await screen.findByText('Saldo 2025:');

    // Act 1: Simula clique no próximo ano
    await act(async () => {
      fireEvent.click(screen.getByText('Simular Clique Próximo Ano'));
    });

    // Assert 1: Modal abriu (Passo 1)
    const nextButtonStep1 = await screen.findByRole('button', { name: "Próximo" });
    expect(nextButtonStep1).toBeInTheDocument();

    // Act 2: Seleciona data de fim
    const endDateInput = screen.getByLabelText(/Data de Fim/i);
    await act(async () => {
      fireEvent.change(endDateInput, { target: { value: '2026-02-18' } });
    });

    // Avança para o Passo 2
    await act(async () => {
      fireEvent.click(nextButtonStep1);
    });

    // Act 3: Preenche hóspedes e avança
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Número de Hóspedes/i), { target: { value: '3' } });
      fireEvent.click(screen.getByRole('button', { name: "Próximo" }));
    });

    // Assert 3: No Passo 3, verifica o resumo
    expect(await screen.findByText('Confirme sua Reserva')).toBeInTheDocument();
    expect(screen.getByText('10/02/2026')).toBeInTheDocument(); // Data Início

    // Valida se o saldo correto (Futuro) está sendo exibido
    expect(screen.getByText('Saldo 2026 (Atual):')).toBeInTheDocument();
    expect(screen.getByText('20 dias')).toBeInTheDocument();
  });
});