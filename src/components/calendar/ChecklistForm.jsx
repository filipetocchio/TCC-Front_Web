// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronDown } from 'lucide-react';

const ESTADOS_CONSERVACAO = ['BOM', 'NOVO', 'DESGASTADO', 'DANIFICADO'];

/**
 * Renderiza uma linha individual para cada item no checklist do inventário.
 */
const ChecklistItem = ({ item, itemState, onItemStateChange }) => {
  const isProblem = itemState.estadoConservacao === 'DESGASTADO' || itemState.estadoConservacao === 'DANIFICADO';

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <span className="font-semibold text-gray-800">{item.nome}</span>
        
        <div className="relative">
          <select
            value={itemState.estadoConservacao}
            onChange={(e) => onItemStateChange('estadoConservacao', e.target.value)}
            className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            {ESTADOS_CONSERVACAO.map(estado => (
              <option key={estado} value={estado}>{estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Campo de observação aparece apenas se houver um problema */}
        {isProblem && (
          <input
            type="text"
            value={itemState.observacao}
            onChange={(e) => onItemStateChange('observacao', e.target.value)}
            placeholder="Descreva o problema (obrigatório)"
            required
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        )}
      </div>
    </div>
  );
};

ChecklistItem.propTypes = {
  item: PropTypes.object.isRequired,
  itemState: PropTypes.object.isRequired,
  onItemStateChange: PropTypes.func.isRequired,
};

/**
 * Componente de formulário para o processo de check-in e check-out,
 * listando os itens do inventário para verificação do usuário.
 */
const ChecklistForm = ({ inventoryItems, onSubmit, checklistType, isLoading }) => {
  const [checklist, setChecklist] = useState({});
  const [generalObservations, setGeneralObservations] = useState('');

  // Inicializa o estado do checklist quando os itens são carregados.
  useEffect(() => {
    const initialState = {};
    inventoryItems.forEach(item => {
      initialState[item.id] = {
        idItemInventario: item.id,
        estadoConservacao: item.estadoConservacao || 'BOM',
        observacao: '',
      };
    });
    setChecklist(initialState);
  }, [inventoryItems]);

  /**
   * Atualiza o estado de um item específico no checklist.
   */
  const handleItemStateChange = (itemId, field, value) => {
    setChecklist(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  /**
   * Submete os dados do checklist para o componente pai.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      itens: Object.values(checklist),
      observacoes: generalObservations,
    };
    onSubmit(payload);
  };

  const title = checklistType === 'CHECKIN' ? 'Check-list do Inventário' : 'Check-out do Inventário';
  const buttonText = checklistType === 'CHECKIN' ? 'Confirmar Check-in' : 'Confirmar Check-out';
  const alertText = checklistType === 'CHECKIN' 
    ? "Verifique o estado de cada item ao chegar. Se encontrar algum problema, descreva-o para se proteger de responsabilidades futuras."
    : "Por favor, confirme o estado de cada item antes de deixar a propriedade.";

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      <div className="p-3 mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-start gap-3 text-sm">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
        <p>{alertText}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {inventoryItems.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              itemState={checklist[item.id] || {}}
              onItemStateChange={(field, value) => handleItemStateChange(item.id, field, value)}
            />
          ))}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Observações Gerais (Opcional)</label>
          <textarea
            value={generalObservations}
            onChange={(e) => setGeneralObservations(e.target.value)}
            rows="3"
            placeholder="Qualquer outra observação sobre sua estadia ou o estado geral da propriedade."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {isLoading ? 'A processar...' : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};

ChecklistForm.propTypes = {
  inventoryItems: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  checklistType: PropTypes.oneOf(['CHECKIN', 'CHECKOUT']).isRequired,
  isLoading: PropTypes.bool,
};

export default ChecklistForm;