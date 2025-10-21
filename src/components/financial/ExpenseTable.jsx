// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente ExpenseTable
 *
 * Descrição:
 * Este arquivo define um componente de tabela reutilizável para exibir uma lista
 * de despesas de forma paginada. Ele é projetado para ser robusto e performático,
 * gerenciando estados de carregamento, listas vazias e interações do usuário.
 *
 * Funcionalidades:
 * - Exibe os dados das despesas em um layout de tabela claro.
 * - Renderiza "esqueletos" de carregamento (skeletons) para uma melhor UX enquanto
 * os dados são buscados.
 * - Apresenta um menu de ações (dropdown) interativo para cada despesa.
 * - Inclui controles de paginação para navegar entre as páginas de resultados.
 * - Otimizado com `React.memo` para prevenir re-renderizações desnecessárias.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MoreVertical, Eye, Edit2, XCircle, CheckCheck } from 'lucide-react';

// --- Subcomponentes de UI ---

/**
 * Mapeamento de status para estilos visuais (cores e rótulos).
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
const StatusBadge = React.memo(({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDENTE;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.color}`}>
      {style.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

/**
 * Renderiza o menu de ações (dropdown) que se posiciona dinamicamente na tela.
 */
const ActionMenu = ({ expense, onView, onEdit, onCancel, onMarkAllAsPaid, isMaster }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let style = {
        right: `${window.innerWidth - rect.right}px`,
      };

      // Se houver menos de 200px (aumentado para segurança) de espaço abaixo, abre para cima.
      if (spaceBelow < 200) { 
        style.bottom = `${window.innerHeight - rect.top}px`;
      } else {
        style.top = `${rect.bottom}px`;
      }
      setMenuStyle(style);
    }
    setIsOpen(prev => !prev);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Garante que o clique não foi no próprio botão que abre o menu
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função helper para fechar o menu ao clicar em um item
  const handleItemClick = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    // O container relativo é necessário apenas para o botão.
    <div className="relative inline-block text-left">
      <button ref={buttonRef} onClick={handleToggle} className="p-2 rounded-full hover:bg-gray-100">
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div 
          ref={menuRef}
          // O menu é posicionado de forma 'fixed' para "escapar" do container com overflow.
          style={menuStyle}
          className="fixed w-48 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5"
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button onClick={() => handleItemClick(() => onView(expense.id))} className="w-full text-left cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
              <Eye size={16} /> Visualizar
            </button>
            {isMaster && (
              <>
<button onClick={() => handleItemClick(() => onEdit(expense))} className="w-full text-left cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  <Edit2 size={16} /> Editar
                </button>

                {/* 4. "Marcar tudo como pago" */}
                <button onClick={() => handleItemClick(() => onMarkAllAsPaid(expense))} className="w-full text-left cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  <CheckCheck size={16} /> Marcar tudo como pago
                </button>

                {/* Separador visual para ações destrutivas */}
                <div className="border-t my-1 border-gray-100" />
                
                <button onClick={() => handleItemClick(() => onCancel(expense))} className="w-full text-left cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                  <XCircle size={16} /> Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ActionMenu.propTypes = {
    expense: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onMarkAllAsPaid: PropTypes.func.isRequired, 
    isMaster: PropTypes.bool.isRequired,
};

// --- Componente Principal da Tabela ---

// 2. Recebe a nova prop 'onMarkAllAsPaid'
const ExpenseTable = ({ expenses, loading, pagination, onPageChange, onViewDetails, onEdit, onCancel, onMarkAllAsPaid, isMaster }) => {
  /**
   * Renderiza os "esqueletos" de carregamento para feedback visual.
   */
  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
        <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td className="px-4 py-4 text-right"><div className="h-6 w-8 bg-gray-200 rounded inline-block"></div></td>
      </tr>
    ))
  );

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
          {loading ? renderSkeletons() : expenses.length > 0 ? (
            expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium text-gray-900">{expense.descricao}</td>
                <td className="px-4 py-4 text-gray-500">{expense.categoria}</td>
                <td className="px-4 py-4 text-gray-900">{Number(expense.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-4 py-4 text-gray-500">{new Date(expense.dataVencimento).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-4"><StatusBadge status={expense.status} /></td>
                <td className="px-4 py-4 text-right">
                  {/* 3. Passa a prop para o ActionMenu */}
                  <ActionMenu 
                    expense={expense} 
                    onView={onViewDetails} 
                    onEdit={onEdit} 
                    onCancel={onCancel} 
                    onMarkAllAsPaid={onMarkAllAsPaid}
                    isMaster={isMaster} 
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhuma despesa encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Controles de Paginação*/}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong> 
            ({pagination.totalRecords} registros)
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => onPageChange(pagination.currentPage - 1)} 
              disabled={pagination.currentPage === 1} 
              className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button 
              onClick={() => onPageChange(pagination.currentPage + 1)} 
              disabled={pagination.currentPage === pagination.totalPages} 
              className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
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
  onMarkAllAsPaid: PropTypes.func.isRequired, 
  isMaster: PropTypes.bool.isRequired,
};

export default ExpenseTable;