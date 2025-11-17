// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este arquivo contém os testes de performance (benchmark) para o componente
 * AcceptInvitePage. O objetivo é medir a velocidade de renderização do
 * componente em seu principal cenário de sucesso (usuário logado).
 *
 * Execução:
 * Este arquivo é projetado para ser executado exclusivamente através do comando
 * de benchmark do Vitest (ex: `npm run bench` ou `vitest bench`). Ele não
 * será executado durante a suíte de testes padrão (`npm test`).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { bench, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcceptInvitePage from './AcceptInvitePage';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// Configura o mock para o módulo de API.
vi.mock('../services/api');

/**
 * Componente wrapper utilitário para renderização em testes.
 *
 * Prover o `AuthContext` e o `MemoryRouter` necessários para que o
 * componente `AcceptInvitePage` possa ser renderizado isoladamente
 * durante a execução do teste de performance.
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

// --- Suíte de Testes de Performance ---
describe('Benchmark: AcceptInvitePage', () => {


 bench('baseline (tarefa síncrona)', () => {
    for (let i = 0; i < 100; i++) {
      Math.sqrt(i);
    }
    
  });

/**
 * Mede o desempenho de renderização (operações por segundo) do
 * componente no cenário de sucesso, onde um usuário já autenticado
 * visualiza um convite válido.
 *
 * Fluxo do Teste:
 * 1. Define o mock da API para simular uma resposta de sucesso.
 * 2. Define as props do provedor de autenticação para simular um usuário logado.
 * 3. Renderiza o componente.
 * 4. (Importante) Aguarda de forma assíncrona (`await`) pela renderização
 * completa do conteúdo, garantindo que o ciclo de vida assíncrono do
 * React seja concluído antes que o Vitest finalize a medição.
 */
bench('Renderização do cenário de sucesso (usuário logado)', async () => {
  // --- 1. Arrange (Mock da API) ---
  api.get.mockResolvedValue({
    data: { data: { propriedade: 'Casa de Praia', convidadoPor: 'Filipe Tocchio', emailConvidado: 'logado@qota.com', numeroDeFracoes: 5, userExists: true }},
  });

  // --- 2. Arrange (Contexto de Autenticação) ---
  const providerProps = { usuario: { id: 1, email: 'logado@qota.com' } };

  // --- 3. Act (Renderização) ---
  renderWithProviders(<AcceptInvitePage />, { providerProps });

  // --- 4. Await (Conclusão Assíncrona) ---
  // Garante que o teste espere o 'useEffect' e a atualização de estado
  // do componente antes de finalizar a medição.
  await screen.findByText('Você foi convidado!');
 });
});