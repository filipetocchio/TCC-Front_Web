// Todos direitos autorais reservados pelo QOTA.

import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import Sidebar from '../components/layout/Sidebar';
import InviteMemberModal from '../components/members/InviteMemberModal';
import Dialog from '../components/ui/dialog';
import { Users, Mail, UserPlus, Clock, ArrowLeft, ShieldCheck, Shield, AlertTriangle, Save, X, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

/**
 * Componente da página para visualização e gerenciamento de membros
 * e convites de uma propriedade específica.
 */
const PropertyMembersPage = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionChangeRequest, setPermissionChangeRequest] = useState(null);
  const [editingCotaId, setEditingCotaId] = useState(null);
  const [cotaValue, setCotaValue] = useState(0);
  const [memberToUnlink, setMemberToUnlink] = useState(null); 


    /**
   * Inicia o fluxo para desvincular um membro, abrindo o diálogo de confirmação.
   */
  const handleUnlinkMember = (member) => {
    setMemberToUnlink(member);
  };

  /**
   * Executa a chamada à API para desvincular o membro após a confirmação do usuário.
   */
  const handleConfirmUnlink = async () => {
    if (!memberToUnlink) return;
    const loadingToast = toast.loading(`Desvinculando ${memberToUnlink.usuario.nomeCompleto}...`);
    try {
      
      await axios.delete(
        `${API_URL}/permission/unlink/member/${memberToUnlink.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Membro desvinculado com sucesso!", { id: loadingToast });
      setMemberToUnlink(null); // Fecha o diálogo
      fetchData(); // Atualiza a lista de membros
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível desvincular o membro.", { id: loadingToast });
      setMemberToUnlink(null);
    }
  };

  /**
   * Busca os dados essenciais da página (propriedade, membros, convites) de forma assíncrona.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      const [propertyResponse, invitesResponse] = await Promise.all([
        axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/invite/property/${propertyId}/pending`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const propertyData = propertyResponse.data.data;
      const membersData = propertyData?.usuarios || [];

      // Validação de segurança: verifica se a API está enviando os dados esperados.
      if (membersData.length > 0 && typeof membersData[0].porcentagemCota === 'undefined') {
        console.error("ALERTA DE INCONSISTÊNCIA: A API não está retornando o campo 'porcentagemCota' para os membros. Verifique o controller 'getById.Property.controller.ts'.");
      }

      setProperty(propertyData);
      setMembers(membersData);
      setPendingInvites(invitesResponse.data.data || []);
    } catch (error) {
      toast.error("Não foi possível carregar os dados dos membros.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Memoiza o cálculo das permissões do usuário para otimizar a renderização.
   */
  const permissionData = useMemo(() => {
    if (!members || members.length === 0) {
      return { isOwnerMaster: false, masterCount: 0 };
    }
    const isMaster = members.some(m => m.usuario?.id === usuario?.id && m.permissao === 'proprietario_master');
    const count = members.filter(m => m.permissao === 'proprietario_master').length;
    return { isOwnerMaster: isMaster, masterCount: count };
  }, [members, usuario]);

  /**
   * Submete a alteração de permissão (role) de um membro para a API.
   */
  const executePermissionChange = async (vinculoId, novaPermissao) => {
    const loadingToast = toast.loading('Atualizando permissão...');
    try {
      await axios.put(`${API_URL}/permission/${vinculoId}`, { permissao: novaPermissao }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Permissão atualizada!', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível atualizar a permissão.', { id: loadingToast });
    }
  };

  /**
   * Inicia o fluxo de alteração de permissão, exibindo um diálogo de confirmação se necessário.
   */
  const requestPermissionChange = (vinculoId, novaPermissao) => {
    const member = members.find(m => m.id === vinculoId);
    const isPromotion = novaPermissao === 'proprietario_master' && member?.permissao !== 'proprietario_master';

    if (isPromotion) {
      setPermissionChangeRequest({ vinculoId, novaPermissao, memberName: member?.usuario?.nomeCompleto || 'o membro' });
    } else {
      executePermissionChange(vinculoId, novaPermissao);
    }
  };

  /**
   * Confirma e executa a alteração de permissão após o diálogo.
   */
  const confirmPermissionChange = () => {
    if (permissionChangeRequest) {
      executePermissionChange(permissionChangeRequest.vinculoId, permissionChangeRequest.novaPermissao);
      setPermissionChangeRequest(null);
    }
  };

  /**
   * Habilita o modo de edição para a cota de um membro específico.
   */
  const handleEditCota = (member) => {
    setEditingCotaId(member.id);
    setCotaValue(member.porcentagemCota ?? 0);
  };

  /**
   * Cancela o modo de edição de cota.
   */
  const handleCancelEdit = () => {
    setEditingCotaId(null);
    setCotaValue(0);
  };

  /**
   * Submete a alteração de porcentagem de cota para a API.
   */
  const handleSaveCota = async (vinculoId) => {
    const loadingToast = toast.loading('Salvando alteração...');
    try {
      await axios.put(
        `${API_URL}/permission/cota/${vinculoId}`,
        { porcentagemCota: parseFloat(cotaValue) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cota atualizada com sucesso!', { id: loadingToast });
      setEditingCotaId(null);
      fetchData(); // Recarrega os dados para refletir as mudanças em toda a tela.
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível salvar. Verifique o valor inserido.', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" />
        <main className="flex-1 p-6 ml-0 sm:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" />
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
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Membro</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Permissão</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Cota (%)</th>
                      {permissionData.isOwnerMaster && <th className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <p className="font-medium text-gray-900">{member.usuario?.nomeCompleto}</p>
                          <p className="text-sm text-gray-500">{member.usuario?.email}</p>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {permissionData.isOwnerMaster ? (
                            <select
                              value={member.permissao}
                              onChange={(e) => requestPermissionChange(member.id, e.target.value)}
                              disabled={(member.usuario?.id === usuario?.id && permissionData.masterCount <= 1) || editingCotaId}
                              className="text-sm font-semibold border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-transparent p-1"
                              title={member.usuario?.id === usuario?.id && permissionData.masterCount <= 1 ? "Não é possível rebaixar o último proprietário master." : "Alterar permissão"}
                            >
                              <option value="proprietario_master">Master</option>
                              <option value="proprietario_comum">Comum</option>
                            </select>
                          ) : (
                            <span className={`text-sm font-semibold flex items-center gap-1 ${member.permissao === 'proprietario_master' ? 'text-yellow-600' : 'text-gray-700'}`}>
                              {member.permissao === 'proprietario_master' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                              {member.permissao === 'proprietario_master' ? 'Master' : 'Comum'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {editingCotaId === member.id ? (
                            <input 
                              type="number"
                              value={cotaValue}
                              onChange={(e) => setCotaValue(e.target.value)}
                              className="w-24 p-1 border rounded-md"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          ) : (
                            `${(member.porcentagemCota ?? 0).toFixed(2)}%`
                          )}
                        </td>
                        {permissionData.isOwnerMaster && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-4">
                            {editingCotaId === member.id ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleSaveCota(member.id)} className="text-green-600 hover:text-green-800" title="Salvar"><Save size={20} /></button>
                                <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800" title="Cancelar"><X size={20} /></button>
                              </div>
                            ) : (
                              <>
                              
                                {member.usuario?.id !== usuario?.id && (
                                  <button onClick={() => handleUnlinkMember(member)} className="text-red-600 hover:text-red-800" title="Desvincular Membro">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                <button onClick={() => handleEditCota(member)} className="text-gold hover:text-black font-medium text-sm">Editar Cota</button>
                              </>
                            )}
                          </div>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                        <div className="text-sm font-semibold text-gray-600">
                          Cota a ser cedida: {(invite.porcentagemCota ?? 0).toFixed(2)}%
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
      <Dialog
        isOpen={!!memberToUnlink}
        onClose={() => setMemberToUnlink(null)}
        title="Confirmar Desvinculação de Cotista"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-lg">
            Você tem certeza que deseja desvincular <strong>{memberToUnlink?.usuario?.nomeCompleto}</strong> da propriedade? A porcentagem de cota dele(a) será transferida para você. Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setMemberToUnlink(null)}>
              Cancelar
            </button>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={handleConfirmUnlink}>
              <Trash2 size={16} /> Confirmar Desvinculação
            </button>
          </div>
        </div>
      </Dialog>
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
            Esta permissão concede acesso total ao gerenciamento da propriedade.
          </p>
          <div className="flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setPermissionChangeRequest(null)}>Cancelar</button>
            <button className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition flex items-center gap-2" onClick={confirmPermissionChange}>Confirmar</button>
          </div>
        </div>
      </Dialog>
      
      <InviteMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} propertyId={Number(propertyId)} token={token} />
    </>
  );
};

PropertyMembersPage.propTypes = {};

export default PropertyMembersPage;