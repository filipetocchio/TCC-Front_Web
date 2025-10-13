// Todos direitos autorais reservados pelo QOTA.

import api from './api';

/**
 * @file propertyService.js
 * @description Centraliza todas as chamadas de API relacionadas ao módulo de propriedades.
 */

/**
 * Busca as propriedades associadas a um usuário específico.
 * @param {number} userId O ID do usuário.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de propriedades do usuário.
 */
export const getPropertiesByUserId = async (userId) => {
  try {
    const response = await api.get(`/permission/user/${userId}/properties`);
    // Retorna o array de dados ou um array vazio em caso de sucesso sem dados.
    return response.data.data || [];
  } catch (error) {
    // Loga o erro no console para depuração e o propaga para a camada que o chamou.
    console.error("Erro ao buscar propriedades do usuário:", error);
    throw error;
  }
};