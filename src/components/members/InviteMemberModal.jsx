// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente InviteMemberModal
 *
 * Descrição:
 * Este arquivo define um componente de modal utilizado por proprietários master
 * para convidar novos membros para uma propriedade. Ele gerencia o estado de um
 * formulário de convite, lida com a submissão para a API e exibe o link de convite
 * gerado para compartilhamento.
 *
 * Funcionalidades:
 * - Coleta de e-mail, permissão e número de frações para o novo membro.
 * - Fornece feedback visual durante o processo de criação do convite.
 * - Exibe o link de convite gerado com uma funcionalidade de "copiar para a área de transferência".
 * - Otimizado com `useCallback` para melhor performance.
 */
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { X, Send, Copy, Loader2 } from 'lucide-react';

// Estado inicial para o formulário do modal.
const initialState = {
  email: '',
  permissao: 'proprietario_comum',
  numeroDeFracoes: 0,
};

const InviteMemberModal = ({ isOpen, onClose, propertyId }) => {
  // --- Gerenciamento de Estado ---
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  /**
   * Atualiza o estado do formulário de forma otimizada conforme o usuário digita.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    // Garante que o número de frações seja tratado como um número inteiro.
    const processedValue = type === 'number' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  }, []);

  /**
   * Processa a criação do convite, enviando os dados para a API.
   */
  const handleInvite = useCallback(async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const loadingToast = toast.loading('Criando convite...');

    try {
      const response = await api.post('/invite', {
        emailConvidado: formData.email,
        idPropriedade: propertyId,
        permissao: formData.permissao,
        numeroDeFracoes: formData.numeroDeFracoes,
      });
      setInviteLink(response.data.data.linkConvite);
      toast.success('Convite criado com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível criar o convite.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  }, [formData, propertyId, isLoading]);

  /**
   * Copia o link de convite gerado para a área de transferência do usuário.
   */
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copiado!');
  }, [inviteLink]);

  /**
   * Reseta o estado do modal e chama a função de fechamento do componente pai.
   */
  const handleClose = useCallback(() => {
    setFormData(initialState);
    setInviteLink('');
    setIsLoading(false);
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-black">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold">Convidar Novo Membro</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Renderiza o formulário ou a tela de sucesso com o link */}
        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail do Convidado</label>
              <input
                type="email" id="email" name="email" value={formData.email}
                onChange={handleInputChange} required placeholder="email@exemplo.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="numeroDeFracoes" className="block text-sm font-medium text-gray-700">Número de Frações</label>
              <input
                type="number" id="numeroDeFracoes" name="numeroDeFracoes" value={formData.numeroDeFracoes}
                onChange={handleInputChange} required min="0" step="1"
                placeholder="Ex: 1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="permissao" className="block text-sm font-medium text-gray-700">Permissão</label>
              <select
                id="permissao" name="permissao" value={formData.permissao} onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="proprietario_comum">Proprietário Comum</option>
                <option value="proprietario_master">Proprietário Master</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">Cancelar</button>
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-black text-white rounded-md font-semibold flex items-center gap-2 disabled:bg-gray-400">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {isLoading ? 'Criando...' : 'Criar Convite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Convite criado! Copie o link abaixo e compartilhe com o novo membro. O link expira em 7 dias.
            </p>
            <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md bg-gray-50">
              <input
                type="text" readOnly value={inviteLink}
                className="w-full bg-transparent text-sm text-gray-600 focus:outline-none"
              />
              <button onClick={copyToClipboard} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                <Copy size={16} />
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleClose} className="px-6 py-2 bg-black text-white rounded-md font-semibold">
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

InviteMemberModal.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
  /** O ID da propriedade para a qual o convite está sendo enviado. */
  propertyId: PropTypes.number.isRequired,
};

export default InviteMemberModal;