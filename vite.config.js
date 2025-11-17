// Todos direitos autorais reservados pelo QOTA.

/**
 * Arquivo de Configuração do Vite (vite.config.js)
 *
 * Descrição:
 * Este arquivo é o ponto central de configuração para o Vite, o build tool
 * utilizado no front-end do QOTA. Ele define o comportamento do servidor de
 * desenvolvimento, a configuração dos plugins (como o React), a integração
 * com o ambiente de testes (Vitest) e os aliases de caminho para
 * simplificar as importações no projeto.
 */

// Importa o helper 'defineConfig' para fornecer autocomplete (IntelliSense)
// e validação de tipos para o objeto de configuração.
import { defineConfig } from 'vite';

// Importa o plugin oficial do Vite para React, que habilita
// a transformação de JSX e o Hot Module Replacement (HMR).
import react from '@vitejs/plugin-react';

// Módulos nativos do Node.js para manipulação de caminhos de arquivo.
import path from 'path';
import { fileURLToPath } from 'url';

// --- Resolução de Caminhos para Módulos ES ---
// Em módulos ES (ECMAScript), `__filename` e `__dirname` não são
// globalmente disponíveis como eram no CommonJS.
// Esta é a solução padrão para recriar essas variáveis.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exporta a configuração principal
export default defineConfig({
  /**
   * Configuração do servidor de desenvolvimento (acessível via `npm run dev`).
   */
  server: {
    // Define a porta em que a aplicação será executada localmente.
    port: 3000,
  },

  /**
   * Lista de plugins utilizados pelo Vite para processar o código.
   */
  plugins: [
    // Habilita o suporte completo ao React, incluindo Fast Refresh (HMR).
    react(),
  ],

  /**
   * Configuração integrada do Vitest (ambiente de testes).
   * O Vite utiliza este bloco para configurar o executor de testes.
   */
  test: {
    // Habilita o uso de globais (describe, it, expect, vi)
    // sem necessidade de importação manual em cada arquivo de teste.
    globals: true,
    
    // Define o ambiente de simulação do DOM. 'jsdom' simula um
    // navegador para que componentes React possam ser renderizados e testados.
    environment: 'jsdom',

    // Especifica um arquivo de setup que será executado antes de cada
    // suíte de testes. Usado para importar matchers (ex: @testing-library/jest-dom).
    setupFiles: './src/setupTests.js',
  },

  /**
   * Configurações de como o Vite resolve os caminhos dos módulos.
   */
  resolve: {
    // Define "aliases" (atalhos) para caminhos de importação.
    alias: {
      // Permite importar arquivos de 'src/' usando o prefixo '@'.
      // Ex: 'import Component from '@/components/MyComponent'
      // Isso evita caminhos relativos complexos (ex: '../../components...').
      '@': path.resolve(__dirname, 'src'),
    },
  },
});