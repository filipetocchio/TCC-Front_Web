/**
 * @file InviteMemberModal.jsx
 * @description Componente de modal para proprietários master convidarem novos membros para uma propriedade.
 * Gerencia o estado do formulário de convite e a exibição do link gerado.
 */
// Todos direitos autorais reservados pelo QOTA.

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Send, Copy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const initialState = {
  email: '',
  permissao: 'proprietario_comum',
  porcentagemCota: 0, // Novo campo
};

const InviteMemberModal = ({ isOpen, onClose, propertyId, token }) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // Garante que a porcentagem seja tratada como número
    const processedValue = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Criando convite...');

    try {
      const response = await axios.post(
        `${API_URL}/invite`,
        {
          emailConvidado: formData.email,
          idPropriedade: propertyId,
          permissao: formData.permissao,
          porcentagemCota: formData.porcentagemCota, // Envia a nova informação
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInviteLink(response.data.data.linkConvite);
      toast.success('Convite criado com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível criar o convite.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copiado!');
  };

  const handleClose = () => {
    setFormData(initialState);
    setInviteLink('');
    setLoading(false);
    onClose();
  };

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

        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail do Convidado</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="email@exemplo.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* Novo Campo de Porcentagem */}
            <div>
              <label htmlFor="porcentagemCota" className="block text-sm font-medium text-gray-700">Porcentagem da Cota (%)</label>
              <input
                type="number"
                id="porcentagemCota"
                name="porcentagemCota"
                value={formData.porcentagemCota}
                onChange={handleInputChange}
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 25"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label htmlFor="permissao" className="block text-sm font-medium text-gray-700">Permissão</label>
              <select
                id="permissao"
                name="permissao"
                value={formData.permissao}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="proprietario_comum">Proprietário Comum</option>
                <option value="proprietario_master">Proprietário Master</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">Cancelar</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-black text-white rounded-md font-semibold flex items-center gap-2 disabled:bg-gray-400">
                <Send size={16} /> {loading ? 'Criando...' : 'Criar Convite'}
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
                type="text"
                readOnly
                value={inviteLink}
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
  /**
   * Controla a visibilidade do modal.
   */
  isOpen: PropTypes.bool.isRequired,
  /**
   * Função para fechar o modal.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * O ID da propriedade para a qual o convite está sendo enviado.
   */
  propertyId: PropTypes.number,
  /**
   * O token de autenticação do usuário que está enviando o convite.
   */
  token: PropTypes.string,
};

export default InviteMemberModal;

