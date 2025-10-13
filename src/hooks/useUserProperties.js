// Todos direitos autorais reservados pelo QOTA.

import { useState, useEffect, useCallback } from 'react';
import { getPropertiesByUserId } from '../services/propertyService';
import useAuth from './useAuth';

/**
 * @hook useUserProperties
 * @description Hook customizado para buscar e gerenciar a lista de propriedades
 * do usuário autenticado. Encapsula os estados de loading, erro e os próprios dados.
 */
export const useUserProperties = () => {
  const { usuario } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Função para buscar os dados da API.
   * É envolvida em 'useCallback' para evitar recriações desnecessárias.
   */
  const fetchData = useCallback(async () => {
    // A busca só é iniciada se houver um usuário autenticado.
    if (!usuario?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertiesByUserId(usuario.id);
      setProperties(data);
    } catch (err) {
      setError('Não foi possível carregar suas propriedades.');
    } finally {
      setLoading(false);
    }
  }, [usuario]); // A dependência é o objeto 'usuario'.

  /**
   * Efeito que dispara a busca de dados quando o componente que usa o hook é montado
   * ou quando a identidade do usuário muda.
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retorna o estado da busca e uma função para recarregar os dados manualmente se necessário.
  return { properties, loading, error, refetch: fetchData };
};