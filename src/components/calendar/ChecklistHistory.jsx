// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Mapeia os estados de conservação para cores e ícones.
 */
const ESTADO_STYLE = {
  NOVO: 'text-green-600',
  BOM: 'text-green-600',
  DESGASTADO: 'text-yellow-600',
  DANIFICADO: 'text-red-600',
};

/**
 * Componente para exibir os detalhes de um checklist de inventário
 * já preenchido (check-in ou check-out).
 */
const ChecklistHistory = ({ checklist }) => {
  const isCheckin = checklist.tipo === 'CHECKIN';
  const title = isCheckin ? 'Histórico de Check-in' : 'Histórico de Check-out';
  const Icon = isCheckin ? CheckCircle : AlertCircle;
  const iconColor = isCheckin ? 'text-green-500' : 'text-blue-500';

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Icon size={24} className={iconColor} />
          {title}
        </h2>
        <span className="text-sm text-gray-500">
          Realizado em: {format(new Date(checklist.data), 'dd/MM/yyyy \'às\' HH:mm')}
        </span>
      </div>
      
      {checklist.observacoes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-700">Observações Gerais:</h4>
          <p className="text-sm text-gray-600">{checklist.observacoes}</p>
        </div>
      )}

      <div className="space-y-2">
        {checklist.itens.map(item => (
          <div key={item.id} className="p-3 border rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.itemInventario.nome}</span>
              <span className={`font-semibold text-sm ${ESTADO_STYLE[item.estadoConservacao]}`}>
                {item.estadoConservacao}
              </span>
            </div>
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
};

ChecklistHistory.propTypes = {
  checklist: PropTypes.object.isRequired,
};

export default ChecklistHistory;