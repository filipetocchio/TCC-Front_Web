// Todos direitos autorais reservados pelo QOTA.

/**
 * Contexto de Autenticação
 *
 * Descrição:
 * Este arquivo cria e exporta o `AuthContext` utilizando a Context API do React.
 *
 * O `AuthContext` funciona como um "contêiner" global para o estado de
 * autenticação. Ele permite que componentes aninhados na árvore de componentes
 * (como a barra de navegação ou páginas protegidas) possam consumir os dados de
 * autenticação (usuário, token, status de carregamento) e as funções de
 * manipulação (login, logout) sem a necessidade de passar props manualmente
 * através de múltiplos níveis (prop drilling).
 *
 * A lógica e o estado real são gerenciados pelo `AuthProvider`.
 */
import { createContext } from 'react';

// Cria o contexto com um valor padrão inicial (que será substituído pelo Provider).
export const AuthContext = createContext();