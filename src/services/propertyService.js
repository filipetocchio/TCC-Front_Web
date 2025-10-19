// Todos direitos autorais reservados pelo QOTA.

/**
 * Serviço de Propriedades
 *
 * Descrição:
 * Este arquivo centraliza todas as chamadas de API relacionadas ao módulo de
 * propriedades. Cada função aqui encapsula a lógica de uma requisição específica,
 * tratando a comunicação com o back-end e o formato dos dados.
 *
 */
import api from './api';

/**
 * Busca a lista paginada de propriedades associadas a um usuário específico.
 * @param {number} userId - O ID do usuário para o qual as propriedades serão buscadas.
 * @param {object} [params] - Parâmetros opcionais para a requisição, como paginação.
 * @param {number} [params.page] - O número da página a ser buscada.
 * @param {number} [params.limit] - O número de itens por página.
 * @returns {Promise<object>} Uma promessa que resolve para o objeto de resposta da API,
 * contendo a lista de propriedades e os dados de paginação.
 */
export const getPropertiesByUserId = async (userId, params = {}) => {
  try {
    // A instância do Axios anexa os parâmetros ao final da URL como query string.
    // Ex: /permission/user/1/properties?page=1&limit=10
    const response = await api.get(`/permission/user/${userId}/properties`, { params });
    
    // Retorna o objeto completo da API, que inclui `data` e `pagination`.
    return response.data;
  } catch (error) {
    // Loga o erro no console para fins de depuração durante o desenvolvimento.
    console.error("Erro ao buscar propriedades do usuário:", error);
    
    // Propaga o erro para que a camada que chamou a função (ex: um hook customizado)
    // possa tratá-lo e atualizar o estado da UI (ex: exibir uma mensagem de erro).
    throw error;
  }
};