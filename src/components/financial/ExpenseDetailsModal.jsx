// Todos direitos autorais reservados pelo QOTA.

import React, { useEffect, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Loader2, User, Check, Calendar, Tag, Edit2, Paperclip } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
// Define a URL base do backend para construir os links dos comprovantes.
const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.split('/api/v1')[0]}` : 'http://localhost:8001';

/**
 * Componente de modal para exibir os detalhes de uma despesa,
 * incluindo a divisão de custos, status de pagamento por cotista e link para comprovante.
 */
const ExpenseDetailsModal = ({ isOpen, onClose, expenseId }) => {
  const { usuario, token } = useContext(AuthContext);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Busca os detalhes completos da despesa na API quando o modal é aberto.
   * Utiliza useCallback para otimização de performance.
   */
  const fetchExpenseDetails = useCallback(async () => {
    if (!expenseId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/financial/expense/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpense(response.data.data);
    } catch (error) {
      toast.error("Não foi possível carregar os detalhes da despesa.");
      onClose(); // Fecha o modal em caso de erro na busca.
    } finally {
      setLoading(false);
    }
  }, [expenseId, token, onClose]);

  /**
   * Efeito que dispara a busca de dados sempre que o modal se torna visível.
   */
  useEffect(() => {
    if (isOpen) {
      fetchExpenseDetails();
    }
  }, [isOpen, fetchExpenseDetails]);

  /**
   * Submete a alteração do status de pagamento de um cotista (pago/pendente).
   */
  const handleTogglePayment = async (paymentId, currentStatus) => {
    const newStatus = !currentStatus;
    const loadingToast = toast.loading('Atualizando status do pagamento...');
    try {
      await axios.put(
        `${API_URL}/financial/payment/${paymentId}`,
        { pago: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status atualizado com sucesso!', { id: loadingToast });
      // Recarrega os dados para refletir a mudança no modal.
      fetchExpenseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível atualizar o status.", { id: loadingToast });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl text-black animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold">Detalhes da Despesa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-gold" size={40} />
          </div>
        ) : expense && (
          <div className="space-y-6">
            {/* Seção de Resumo da Despesa */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-3">{expense.descricao}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2"><Tag size={16} className="text-gray-500"/><strong>Categoria:</strong> {expense.categoria}</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-500"/><strong>Vencimento:</strong> {new Date(expense.dataVencimento).toLocaleDateString('pt-BR')}</div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1"><strong className="text-lg">Valor Total:</strong> <span className="text-lg font-bold text-blue-600">{Number(expense.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
              </div>

              {/* Seção para exibir o link dos comprovantes, se existirem */}
              {expense.urlComprovante && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Comprovantes Anexados:</h4>
                  <div className="flex flex-col items-start gap-2">
                    {/* Separa a string pelos nomes dos arquivos e cria um link para cada um */}
                    {expense.urlComprovante.split(',').map((url, index) => (
                      <a 
                        key={index}
                        href={`${BASE_URL}${url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                      >
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
                  // Determina se o usuário logado tem permissão para alterar o status.
                  const canToggle = usuario.id === pagamento.idCotista || expense.currentUserIsMaster;
                  
                  return (
                    <li key={pagamento.id} className="py-3 flex justify-between items-center gap-4">
                      {/* Bloco de informações do cotista (Nome e Valor) */}
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full"><User size={18} className="text-gray-600"/></div>
                        <div>
                          <p className="font-semibold">{pagamento.cotista.nomeCompleto}</p>
                          <p className="text-sm text-gray-500">{Number(pagamento.valorDevido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      </div>
                      
                      {/* Bloco de Ações (Status e Botão de Edição) */}
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full transition-colors ${pagamento.pago ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pagamento.pago && <Check size={14} />}
                            {pagamento.pago ? 'Pago' : 'Pendente'}
                        </span>
                        {canToggle && (
                          <button
                            onClick={() => handleTogglePayment(pagamento.id, pagamento.pago)}
                            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
                            title={pagamento.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                          >
                            <Edit2 size={16} />
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
      </div>
    </div>
  );
};

ExpenseDetailsModal.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
  /** ID da despesa a ser exibida. */
  expenseId: PropTypes.number,
};

export default ExpenseDetailsModal;

