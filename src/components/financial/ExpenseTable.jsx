// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import PropTypes from 'prop-types';
import { MoreVertical, Eye, Edit, XCircle } from 'lucide-react';

/**
 * Mapeia os status das despesas para cores e textos,
 * garantindo consistência visual em toda a aplicação.
 */
const STATUS_STYLES = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PARCIALMENTE_PAGO: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
  PAGO: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  ATRASADO: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

/**
 * Renderiza um selo (badge) visualmente distinto para o status da despesa.
 */
const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDENTE;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.color}`}>
      {style.label}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

/**
 * Componente reutilizável para a tabela de despesas, incluindo
 * paginação, estados de carregamento e menu de ações.
 */
const ExpenseTable = ({
  expenses,
  loading,
  pagination,
  onPageChange,
  onViewDetails,
  onEdit,
  onCancel
}) => {

  /**
   * Renderiza os "esqueletos" de carregamento para fornecer um feedback
   * visual enquanto os dados estão sendo buscados na API.
   */
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
        <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td className="px-4 py-4"><div className="h-6 w-8 bg-gray-200 rounded"></div></td>
      </tr>
    ));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            renderSkeletons()
          ) : expenses.length > 0 ? (
            expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium text-gray-900">{expense.descricao}</td>
                <td className="px-4 py-4 text-gray-500">{expense.categoria}</td>
                <td className="px-4 py-4 text-gray-900">
                  {Number(expense.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-4 py-4 text-gray-500">
                  {new Date(expense.dataVencimento).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={expense.status} />
                </td>
                <td className="px-4 py-4 text-right">
                  
                  <div className="relative inline-block text-left">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                      <MoreVertical size={18} />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
                        <a onClick={() => onViewDetails(expense.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Eye size={16} /> Visualizar
                        </a>
                        <a onClick={() => onEdit(expense.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Edit size={16} /> Editar
                        </a>
                        <a onClick={() => onCancel(expense.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <XCircle size={16} /> Cancelar
                        </a>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhuma despesa encontrada para este período.</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Controles de Paginação */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

ExpenseTable.propTypes = {
  expenses: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.object,
  onPageChange: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ExpenseTable;