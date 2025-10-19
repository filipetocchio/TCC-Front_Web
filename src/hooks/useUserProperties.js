// Todos direitos autorais reservados pelo QOTA.

/**
 * Hook Customizado - useUserProperties
 *
 * Descrição:
 * Este hook encapsula a lógica de negócio para buscar e gerenciar a lista paginada
 * de propriedades associadas ao usuário autenticado.
 *
 * Responsabilidades:
 * 1.  Gerenciar o estado dos dados, incluindo a lista de propriedades (`properties`),
 * o estado de carregamento (`loading`) e possíveis erros (`error`).
 * 2.  Lidar com a paginação, controlando a página atual e o limite de itens.
 * 3.  Abstrair a chamada à API, fornecendo uma interface simples para os componentes.
 * 4.  Otimizar a performance com `useCallback` para evitar a recriação da função
 * de busca em cada renderização.
 *
 * @returns {object} Um objeto contendo o estado da busca (`properties`, `loading`, `error`),
 * os dados de paginação (`pagination`) e funções para interagir com a lista (`refetch`, `goToPage`).
 */
import { useState, useEffect, useCallback } from 'react';
import { getPropertiesByUserId } from '../services/propertyService';
import useAuth from './useAuth';

export const useUserProperties = () => {
  // --- Gerenciamento de Estado ---
  const { usuario } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para controlar a paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  /**
   * Função para buscar os dados da API de forma paginada.
   * Envolvida em 'useCallback' para otimização de performance.
   */
  const fetchData = useCallback(async (pageToFetch = 1) => {
    // A busca só é iniciada se houver um usuário autenticado.
    if (!usuario?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Chama o serviço passando o ID do usuário e os parâmetros de paginação.
      const response = await getPropertiesByUserId(usuario.id, {
        page: pageToFetch,
        limit: pagination.limit,
      });
      
      // Atualiza o estado com os dados e as informações de paginação retornadas pela API.
      setProperties(response.data);
      setPagination({
        page: response.pagination.currentPage,
        limit: response.pagination.limit,
        totalRecords: response.pagination.totalRecords,
        totalPages: response.pagination.totalPages,
      });
    } catch (err) {
      setError('Não foi possível carregar suas propriedades.');
    } finally {
      setLoading(false);
    }
  }, [usuario?.id, pagination.limit]); // A dependência otimizada é o ID do usuário e o limite por página.

  /**
   * Efeito que dispara a busca de dados quando o componente que usa o hook é montado
   * ou quando a identidade do usuário muda.
   */
  useEffect(() => {
    fetchData(1); // Sempre busca a primeira página ao montar ou ao trocar de usuário.
  }, [fetchData]);

  /**
   * Função para navegar para uma página específica.
   * @param {number} pageNumber - O número da página a ser buscada.
   */
  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
      fetchData(pageNumber);
    }
  };

  // Retorna o estado da busca e funções para interagir com os dados.
  return { 
    properties, 
    loading, 
    error, 
    pagination: {
        currentPage: pagination.page,
        ...pagination
    },
    refetch: () => fetchData(pagination.page), // Recarrega a página atual.
    goToPage 
  };
};