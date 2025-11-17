// Todos direitos autorais reservados pelo QOTA.

/**
 * Este arquivo é executado antes de todas as suítes de teste.
 * 1. Importa os matchers do 'jest-dom' (ex: .toBeInTheDocument()).
 * 2. Importa os matchers do 'vitest-axe' (ex: .toHaveNoViolations()).
 * 3. Estende o 'expect' do Vitest para incluir ambos os conjuntos de matchers.
 */
import { expect } from 'vitest';

// Importa os matchers de acessibilidade (axe)
import * as axeMatchers from 'vitest-axe/matchers';

// Importa os matchers do DOM (jest-dom)
import '@testing-library/jest-dom';

// Estende o 'expect' nativo do Vitest com ambos os conjuntos de matchers
expect.extend(axeMatchers);