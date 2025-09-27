/**
 * @file InviteMemberModal.jsx
 * @description Componente de modal para proprietários master convidarem novos membros para uma propriedade.
 */
// Todos direitos autorais reservados pelo QOTA.

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Send, Copy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const InviteMemberModal = ({ isOpen, onClose, propertyId, token }) => {
  const [email, setEmail] = useState('');
  const [permissao, setPermissao] = useState('proprietario_comum');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Enviando convite...');

    try {
      const response = await axios.post(
        `${API_URL}/invite`,
        {
          emailConvidado: email,
          idPropriedade: propertyId,
          permissao,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInviteLink(response.data.data.linkConvite);
      toast.success('Convite criado com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível enviar o convite.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleClose = () => {
    setEmail('');
    setPermissao('proprietario_comum');
    setInviteLink('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-black">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold">Convidar Membro</h2>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@exemplo.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="permissao" className="block text-sm font-medium text-gray-700">Permissão</label>
              <select
                id="permissao"
                value={permissao}
                onChange={(e) => setPermissao(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="proprietario_comum">Proprietário Comum</option>
                
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">Cancelar</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-black text-white rounded-md font-semibold flex items-center gap-2 disabled:bg-gray-400">
                <Send size={16} /> {loading ? 'Enviando...' : 'Enviar Convite'}
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
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  propertyId: PropTypes.number,
  token: PropTypes.string,
};

export default InviteMemberModal;

