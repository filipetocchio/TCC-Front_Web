/**
 * @file PropertyMembersPage.jsx
 * @description Página para visualização e gerenciamento de membros e convites de uma propriedade.
 * Permite que proprietários master alterem permissões e convidem novos usuários, com
 * diálogos de confirmação para ações críticas.
 */
import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import InviteMemberModal from '../components/members/InviteMemberModal';
import Dialog from '../components/ui/dialog';

import { Users, Mail, UserPlus, Clock, ArrowLeft, ShieldCheck, Shield, AlertTriangle } from 'lucide-react';

/**
 * URL base da API, obtida de variáveis de ambiente com um fallback para desenvolvimento local.
 * @type {string}
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const PropertyMembersPage = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionChangeRequest, setPermissionChangeRequest] = useState(null);

  /**
   * @function fetchData
   * @description Busca os dados da propriedade, seus membros e convites pendentes de forma concorrente.
   * A função é memoizada com useCallback para otimizar o desempenho, evitando recriações desnecessárias.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      const [propertyResponse, invitesResponse] = await Promise.all([
        axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/invite/property/${propertyId}/pending`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      setProperty(propertyResponse.data.data);
      setMembers(propertyResponse.data.data.usuarios || []);
      setPendingInvites(invitesResponse.data.data || []);
    } catch (error) {
      toast.error("Não foi possível carregar os dados dos membros.");
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * @property {object} permissionData
   * @description Estados derivados e memoizados para otimizar a lógica de permissões.
   * `isOwnerMaster` verifica se o usuário logado é um administrador desta propriedade.
   * `masterCount` conta o número total de administradores para aplicar regras de segurança.
   */
  const permissionData = useMemo(() => {
    const isMaster = members.some(m => m.usuario?.id === usuario?.id && m.permissao === 'proprietario_master');
    const count = members.filter(m => m.permissao === 'proprietario_master').length;
    return { isOwnerMaster: isMaster, masterCount: count };
  }, [members, usuario]);

  /**
   * @function executePermissionChange
   * @description Executa a alteração de permissão na API e atualiza o estado local.
   */
  const executePermissionChange = async (vinculoId, novaPermissao) => {
    const loadingToast = toast.loading('Atualizando permissão...');
    try {
      await axios.put(
        `${API_URL}/permission/${vinculoId}`,
        { permissao: novaPermissao },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(currentMembers =>
        currentMembers.map(m => (m.id === vinculoId ? { ...m, permissao: novaPermissao } : m))
      );
      toast.success('Permissão atualizada!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível atualizar a permissão.', { id: loadingToast });
    }
  };
  
  /**
   * @function requestPermissionChange
   * @description Inicia o fluxo de alteração de permissão, exibindo um alerta de confirmação
   * quando a promoção para 'proprietario_master' é selecionada.
   */
  const requestPermissionChange = (vinculoId, novaPermissao) => {
    const member = members.find(m => m.id === vinculoId);
    if (novaPermissao === 'proprietario_master') {
      setPermissionChangeRequest({
        vinculoId,
        novaPermissao,
        memberName: member?.usuario?.nomeCompleto || 'o membro',
      });
    } else {
      executePermissionChange(vinculoId, novaPermissao);
    }
  };

  /**
   * @function confirmPermissionChange
   * @description Confirma e executa a promoção para 'proprietario_master' após o alerta.
   */
  const confirmPermissionChange = () => {
    if (permissionChangeRequest) {
      executePermissionChange(permissionChangeRequest.vinculoId, permissionChangeRequest.novaPermissao);
      setPermissionChangeRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 sm:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-4 sm:p-6 ml-0 sm:ml-64">
          <div className="max-w-4xl mx-auto">
            <Link to={paths.propriedade.replace(':id', propertyId)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4">
              <ArrowLeft size={16} /> Voltar para a Propriedade
            </Link>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{property?.nomePropriedade}</h1>
                <p className="text-gray-500">Gerenciamento de Cotistas e Convites</p>
              </div>
              {permissionData.isOwnerMaster && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  <UserPlus size={18} />Convidar Novo Membro
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users size={22} /> Membros Atuais ({members.length})</h2>
              <ul className="divide-y divide-gray-200">
                {members.map(member => (
                  <li key={member.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{member.usuario?.nomeCompleto}</p>
                      <p className="text-sm text-gray-500">{member.usuario?.email}</p>
                    </div>
                    {permissionData.isOwnerMaster ? (
                      <select
                        value={member.permissao}
                        onChange={(e) => requestPermissionChange(member.id, e.target.value)}
                        disabled={member.usuario?.id === usuario?.id && permissionData.masterCount <= 1}
                        className="mt-2 sm:mt-0 text-sm font-semibold border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title={member.usuario?.id === usuario?.id && permissionData.masterCount <= 1 ? "Não é possível rebaixar o último proprietário master." : "Alterar permissão"}
                      >
                        <option value="proprietario_master">Proprietário Master</option>
                        <option value="proprietario_comum">Proprietário Comum</option>
                      </select>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full mt-2 sm:mt-0 flex items-center gap-1">
                        {member.permissao === 'proprietario_master' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                        {member.permissao === 'proprietario_master' ? 'Proprietário Master' : 'Proprietário Comum'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {permissionData.isOwnerMaster && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Mail size={22} /> Convites Pendentes</h2>
                {pendingInvites.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {pendingInvites.map(invite => (
                      <li key={invite.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                          <p className="font-medium text-gray-900">{invite.emailConvidado}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={12} /> Expira em: {new Date(invite.dataExpiracao).toLocaleDateString()}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Não há convites pendentes no momento.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog isOpen={!!permissionChangeRequest} onClose={() => setPermissionChangeRequest(null)} title="Confirmar Alteração de Permissão">
        <div className="p-6">
          <div className="flex items-start sm:items-center gap-4 mb-4">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Tem certeza que deseja promover &quot;{permissionChangeRequest?.memberName}&quot; para <strong>Proprietário Master</strong>?
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6 sm:pl-16">
            Esta permissão concede acesso total ao gerenciamento da propriedade, incluindo convidar e remover membros, editar detalhes e gerenciar o inventário.
          </p>
          <div className="flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setPermissionChangeRequest(null)}>Cancelar</button>
            <button className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition flex items-center gap-2" onClick={confirmPermissionChange}>Confirmar Promoção</button>
          </div>
        </div>
      </Dialog>
      
      <InviteMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} propertyId={Number(propertyId)} token={token} />
    </>
  );
};

// Adiciona validação de PropTypes para o componente principal, garantindo a integridade dos dados recebidos.
PropertyMembersPage.propTypes = {};

export default PropertyMembersPage;