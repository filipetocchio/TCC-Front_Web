// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Objetivo:
 * Medir a velocidade de renderização do principal dashboard do sistema.
 * Este teste simula o cenário de "pior caso" (usuário logado, com dados
 * de API), medindo o tempo total desde a renderização até a exibição
 * dos dados processados (estatísticas e gráficos).
 *
 * Execução:
 * Este arquivo é executado pelo comando `npm run bench` (ou `vitest bench`).
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { bench, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import FinancialDashboard from './FinancialDashboard';
import api from '../services/api';

// --- Configuração de Mocks ---

// Mock da API para simular respostas rápidas
vi.mock('../services/api');

// Mock da biblioteca de gráficos (Recharts)
// Gráficos são pesados para renderizar no JSDOM e irrelevantes
// para o teste de lógica. <div>.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="mock-chart-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="mock-area-chart">{children}</div>,
  Area: () => <div data-testid="mock-area" />,
  XAxis: () => <div data-testid="mock-xaxis" />,
  YAxis: () => <div data-testid="mock-yaxis" />,
  Tooltip: () => <div data-testid="mock-tooltip" />,
  CartesianGrid: () => <div data-testid="mock-grid" />,
}));

// --- Dados Mockados ---
const mockUser = { id: 1, nomeCompleto: 'Usuario Teste' };
const mockSummaryData = {
  totalSpent: 1500.75,
  projectedSpending: 300.50,
  topCategory: 'Energia',
  chartData: [
    { name: 'Jan', valor: 100 },
    { name: 'Fev', valor: 150 },
  ],
};

/**
 * Wrapper de renderização para o benchmark, fornecendo
 * o contexto de autenticação e o roteador.
 */
const renderWithProviders = (ui, { providerProps }) => {
  return render(
    <AuthContext.Provider value={providerProps}>
      <MemoryRouter initialEntries={['/dashboard/1']}>
        <Routes>
          <Route path="/dashboard/:propertyId" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

// --- Suíte de Benchmark ---

describe('Benchmark: FinancialDashboard', () => {

bench('baseline (tarefa síncrona)', () => {
    for (let i = 0; i < 100; i++) {
      Math.sqrt(i);
    }
  });
  
  /**
   * Mede o desempenho de renderização (operações por segundo)
   * do componente no cenário de sucesso (usuário logado).
   *
   * Fluxo:
   * 1. Define os mocks da API para sucesso.
   * 2. Define o contexto de usuário logado.
   * 3. Renderiza o componente.
   * 4. Aguarda (await) a exibição do dado final (ex: o total gasto).
   */
  bench('Renderização do dashboard com sucesso (dados de API)', async () => {
    // --- Arrange ---
    // Simula uma resposta de sucesso da API
    api.get.mockResolvedValue({
      data: { data: mockSummaryData },
    });
    
    // Simula um usuário logado no AuthContext
    const providerProps = {
      usuario: mockUser,
      authLoading: false, // Assume que o provider já carregou
    };

    // --- Act & Await ---
    // 'act' garante que todas as atualizações de estado do React
    // sejam processadas antes da medição terminar.
    await act(async () => {
      renderWithProviders(<FinancialDashboard />, { providerProps });
      
      // Garante que o teste só termine após a renderização
      // do dado que depende da chamada de API.
      await screen.findByText('Total Gasto no Período');
    });

    // O Vitest 'bench' mede o tempo que levou
    // para o bloco 'await act(...)' ser concluído.
  });
});