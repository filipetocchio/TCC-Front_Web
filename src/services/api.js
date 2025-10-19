// Todos direitos autorais reservados pelo QOTA.

/**
 * Módulo de Configuração da API
 *
 * Descrição:
 * Este arquivo centraliza a configuração do cliente HTTP (Axios) utilizado para
 * a comunicação com a API do QOTA. Ele cria uma instância padronizada do Axios
 * e implementa interceptors para gerenciar automaticamente o estado da sessão
 * do usuário em toda a aplicação.
 *
 * Interceptors Implementados:
 * - Resposta (Response): Intercepta todas as respostas da API. Se um erro de
 * autenticação (status 401 ou 403) for detectado em uma rota protegida, ele
 * limpa o estado de autenticação do cliente e redireciona o usuário para a
 * página de login, garantindo uma experiência de usuário segura e consistente.
 */
import axios from 'axios';
import paths from '../routes/paths';

/**
 * Cria uma instância centralizada do Axios para todas as requisições da API.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  // Habilita o envio de credenciais (como cookies) em requisições cross-origin,
  // crucial para o funcionamento do sistema de refresh token.
  withCredentials: true,
});

/**
 * Define ou remove o token de autorização JWT dos cabeçalhos padrão do Axios.
 * Esta função é chamada pelo AuthProvider para sincronizar o estado de autenticação
 * com o cliente da API.
 * @param {string | null} token - O token de acesso JWT ou null para limpar.
 */
export const setAuthToken = (token) => {
  if (token) {
    // Anexa o token ao cabeçalho 'Authorization' para todas as futuras requisições.
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remove o cabeçalho de autorização se não houver token (ex: no logout).
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Interceptor de Resposta: Gerencia globalmente os erros de autenticação.
 * Se a API retornar um erro 401 (Não Autorizado) ou 403 (Proibido) em uma
 * rota que não seja pública, ele assume que a sessão do usuário expirou ou é
 * inválida, limpa os dados de autenticação e redireciona para a tela de login.
 */
api.interceptors.response.use(
  (response) => response, // Retorna a resposta diretamente em caso de sucesso.
  (error) => {
    // Verifica se o erro é de autenticação/autorização.
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    
    // Verifica se a rota atual já é uma página pública para evitar loops de redirecionamento.
    const publicPaths = [
      paths.login,
      paths.cadastro,
      '/termos-de-uso',
      '/politica-de-privacidade',
    ];

    if (isAuthError && !isPublicPath) {
      // Tenta notificar o backend para limpar o cookie httpOnly.
      // A falha nesta chamada não impede o logout do lado do cliente.
      api.post('/auth/logout').catch(err => console.error('Falha ao notificar servidor no logout automático:', err));
      
      // Limpa os dados de autenticação do cliente.
      setAuthToken(null); 
      localStorage.removeItem('usuario');
      
      // Redireciona o usuário para a página de login.
      window.location.href = paths.login; 
    }
    
    // Propaga o erro para que possa ser tratado localmente no componente que fez a chamada.
    return Promise.reject(error);
  }
);

export default api;