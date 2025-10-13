// Todos direitos autorais reservados pelo QOTA.

import axios from 'axios';
import paths from '../routes/paths';

let token = null;

export const setAuthToken = (newToken) => {
  token = newToken;
};

/**
 * Instância centralizada do Axios.
 * Todas as requisições para a API devem passar por aqui.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  /**
   * Habilita o envio de credenciais (como cookies) em requisições cross-origin.
   * Esta é a configuração crucial para que o backend receba o cookie 'jwt' (refreshToken)
   * e consiga restaurar a sessão do usuário após um refresh na página (F5).
   */
  withCredentials: true, 
});

/**
 * Interceptor de Requisição.
 * Adiciona o token de acesso (armazenado em memória) a cada requisição enviada.
 */
api.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de Resposta.
 * Trata erros de autenticação (401/403) de forma global, redirecionando o usuário
 * para a página de login caso sua sessão expire em uma rota protegida.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isPublicPath = window.location.pathname === paths.login || window.location.pathname === paths.cadastro;

    if (isAuthError && !isPublicPath) {
      setAuthToken(null); 
      localStorage.removeItem('usuario');
      window.location.href = paths.login; 
    }
    
    return Promise.reject(error);
  }
);

export default api;