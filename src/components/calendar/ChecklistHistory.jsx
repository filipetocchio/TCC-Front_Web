// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente ChecklistHistory
 *
 * Descrição:
 * Este arquivo define um componente de exibição para o histórico de um checklist
 * de inventário já preenchido (seja de check-in ou check-out). Ele renderiza
 * as informações de forma clara e organizada, destacando os itens que
 * apresentaram problemas.
 *
 * O componente é otimizado com `React.memo` para garantir a melhor performance,
 * evitando re-renderizações desnecessárias.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Mapeamento de estilos para os diferentes estados de conservação dos itens.
const ESTADO_STYLE = {
  NOVO: 'text-green-600',
  BOM: 'text-green-600',
  DESGASTADO: 'text-yellow-600',
  DANIFICADO: 'text-red-600',
};

const ChecklistHistory = React.memo(({ checklist }) => {
  // Determina os elementos visuais com base no tipo de checklist.
  const isCheckin = checklist.tipo === 'CHECKIN';
  const title = isCheckin ? 'Histórico de Check-in' : 'Histórico de Check-out';
  const Icon = isCheckin ? CheckCircle : AlertCircle;
  const iconColor = isCheckin ? 'text-green-500' : 'text-blue-500';

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Cabeçalho do Checklist */}
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Icon size={24} className={iconColor} />
          {title}
        </h2>
        <span className="text-sm text-gray-500">
          Realizado em: {format(new Date(checklist.data), "dd/MM/yyyy 'às' HH:mm")}
        </span>
      </div>
      
      {/* Exibe as observações gerais, se houver. */}
      {checklist.observacoes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-700">Observações Gerais:</h4>
          <p className="text-sm text-gray-600">{checklist.observacoes}</p>
        </div>
      )}

      {/* Lista de Itens Verificados */}
      <div className="space-y-2">
        {checklist.itens.map(item => (
          <div key={item.id} className="p-3 border rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.itemInventario.nome}</span>
              <span className={`font-semibold text-sm ${ESTADO_STYLE[item.estadoConservacao]}`}>
                {item.estadoConservacao}
              </span>
            </div>
            {/* Exibe a observação específica do item, se houver. */}
            {item.observacao && (
              <p className="text-xs text-red-700 mt-1 pl-1 border-l-2 border-red-200">
                Observação: {item.observacao}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

// Adiciona um nome de exibição para facilitar a depuração no React DevTools.
ChecklistHistory.displayName = 'ChecklistHistory';

ChecklistHistory.propTypes = {
  /** O objeto de checklist completo, vindo da API, incluindo a lista de itens. */
  checklist: PropTypes.object.isRequired,
};

export default ChecklistHistory;