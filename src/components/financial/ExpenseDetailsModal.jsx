// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente ExpenseDetailsModal
 *
 * Descrição:
 * Este arquivo define um modal para exibir os detalhes completos de uma despesa.
 * Ele busca os dados da despesa na API e exibe informações como categoria,
 * valor, vencimento, comprovantes e, crucialmente, a lista de pagamentos
 * individuais de cada cotista.
 *
 * Funcionalidades:
 * - Busca os dados da despesa de forma assíncrona ao ser aberto.
 * - Exibe o status de pagamento de cada cotista.
 * - Permite que o usuário logado (se tiver permissão) altere o status de um
 * pagamento (pago/pendente) através de uma atualização otimista para uma
 * experiência de usuário instantânea.
 * - Fornece links para visualização dos comprovantes anexados.
 */
import React, { useEffect, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Dialog from '../ui/dialog';
import { X, Loader2, User, Check, Calendar, Tag, Paperclip, Edit2 } from 'lucide-react';


const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

const ExpenseDetailsModal = ({ isOpen, onClose, expenseId }) => {
  // --- Hooks e Estado ---
  const { usuario } = useContext(AuthContext);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingPaymentId, setSubmittingPaymentId] = useState(null);

  /**
   * Busca os detalhes completos da despesa na API.
   */
  const fetchExpenseDetails = useCallback(async () => {
    if (!expenseId) return;
    setLoading(true);
    try {
      const response = await api.get(`/financial/expense/${expenseId}`);
      setExpense(response.data.data);
    } catch (error) {
      toast.error("Não foi possível carregar os detalhes da despesa.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [expenseId, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchExpenseDetails();
    }
  }, [isOpen, fetchExpenseDetails]);

  /**
   * Submete a alteração do status de pagamento de um cotista.
   * Utiliza uma abordagem de "atualização otimista" para uma UX mais rápida.
   */
  const handleTogglePayment = useCallback(async (paymentId, currentStatus) => {
    if (submittingPaymentId) return;

    setSubmittingPaymentId(paymentId);
    const newStatus = !currentStatus;

    // --- Atualização Otimista ---
    // 1. Salva o estado original para possível reversão.
    const originalExpense = { ...expense };
    // 2. Atualiza a UI imediatamente.
    setExpense(prev => {
        const newPagamentos = prev.pagamentos.map(p => 
            p.id === paymentId ? { ...p, pago: newStatus } : p
        );
        return { ...prev, pagamentos: newPagamentos };
    });

    try {
      // 3. Envia a requisição para a API em segundo plano.
      await api.put(`/financial/payment/${paymentId}`, { pago: newStatus });
      // 4. (Opcional) Recarrega os dados para garantir consistência total com o backend.
      // fetchExpenseDetails(); // Descomente se for crucial ter o status geral da despesa atualizado.
    } catch (error) {
      // 5. Em caso de erro, reverte a UI para o estado original e notifica o usuário.
      toast.error(error.response?.data?.message || "Não foi possível atualizar o status.");
      setExpense(originalExpense);
    } finally {
      setSubmittingPaymentId(null);
    }
  }, [expense, submittingPaymentId]);

  if (!isOpen) return null;

return (
    // Passa a prop 'width' diretamente para o Dialog, que agora controla o tamanho.
    <Dialog isOpen={isOpen} onClose={onClose} title="Detalhes da Despesa" width="max-w-3xl">
      {loading ? (
        <div className="flex justify-center items-center h-64 p-6">
          <Loader2 className="animate-spin text-gold" size={40} />
        </div>
      ) : expense && (
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Seção de Resumo da Despesa (agora com espaço suficiente) */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-lg mb-3">{expense.descricao}</h3>
              {/* Grid para alinhar os detalhes da despesa de forma responsiva. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-gray-500 flex-shrink-0"/>
                  <strong>Categoria:</strong>
                  <span className="truncate">{expense.categoria}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500 flex-shrink-0"/>
                  <strong>Vencimento:</strong>
                  <span>{new Date(expense.dataVencimento).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="flex-shrink-0">Valor Total:</strong> 
                  <span className="font-bold text-blue-600">
                    {Number(expense.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

            {expense.urlComprovante && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Comprovantes:</h4>
                <div className="flex flex-col items-start gap-2">
                  {expense.urlComprovante.split(',').map((url, index) => (
                    <a key={index} href={`${API_BASE_URL}${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                      <Paperclip size={16} />
                      Visualizar Comprovante {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seção de Divisão por Cotista */}
          <div>
            <h3 className="font-semibold mb-3">Divisão por Cotista</h3>
            <ul className="divide-y divide-gray-200">
              {expense.pagamentos.map(pagamento => {
                const canToggle = usuario.id === pagamento.idCotista || expense.currentUserIsMaster;
                const isUpdatingThis = submittingPaymentId === pagamento.id;
                
                return (
                  <li key={pagamento.id} className="py-3 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full"><User size={18} className="text-gray-600"/></div>
                      <div>
                        <p className="font-semibold">{pagamento.cotista.nomeCompleto}</p>
                        <p className="text-sm text-gray-500">{Number(pagamento.valorDevido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full transition-colors ${pagamento.pago ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {pagamento.pago && <Check size={14} />}
                        {pagamento.pago ? 'Pago' : 'Pendente'}
                      </span>
                      {canToggle && (
                        <button
                          onClick={() => handleTogglePayment(pagamento.id, pagamento.pago)}
                          disabled={isUpdatingThis}
                          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={pagamento.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                        >
                          {isUpdatingThis ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
           </div>
          </div>
        )}     
    </Dialog>
  );
};

ExpenseDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  expenseId: PropTypes.number,
};

export default ExpenseDetailsModal;