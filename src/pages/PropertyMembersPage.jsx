// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Gerenciamento de Membros
 *
 * Descrição:
 * Este arquivo define a página onde um proprietário master pode gerenciar os
 * membros (cotistas) e os convites pendentes de uma propriedade específica.
 *
 * Funcionalidades:
 * - Exibe uma lista de todos os membros atuais da propriedade.
 * - Permite que um master edite a permissão e o número de frações de outros membros.
 * - Permite que um master remova (desvincule) outros membros.
 * - Exibe uma lista de convites que ainda estão pendentes.
 * - Fornece acesso para criar novos convites através de um modal.
 * - Garante que apenas usuários com permissão de master possam executar ações administrativas.
 */
import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import InviteMemberModal from '../components/members/InviteMemberModal';
import Dialog from '../components/ui/dialog';
import { Users, Mail, UserPlus, Clock, ArrowLeft, ShieldCheck, Shield, AlertTriangle, Save, X, Trash2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';

const PropertyMembersPage = () => {
  // --- Hooks e Estado Principal ---
  const { id: propertyId } = useParams();
  const { usuario } = useAuth();

  const [property, setProperty] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [permissionChangeRequest, setPermissionChangeRequest] = useState(null);
  const [memberToUnlink, setMemberToUnlink] = useState(null);
  
  const [editingFracaoId, setEditingFracaoId] = useState(null);
  const [fracaoValue, setFracaoValue] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Busca todos os dados necessários para a página.
   */
  const fetchData = useCallback(async () => {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const propertyResponse = await api.get(`/property/${propertyId}`);
      const propertyData = propertyResponse.data.data;
      
      setProperty(propertyData);
      setMembers(propertyData?.usuarios || []);

      const currentUserIsMaster = propertyData?.usuarios.some(m => m.usuario?.id === usuario.id && m.permissao === 'proprietario_master');
      if (currentUserIsMaster) {
        const invitesResponse = await api.get(`/invite/property/${propertyId}/pending`);
        setPendingInvites(invitesResponse.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível carregar os dados dos membros.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, usuario?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const permissionData = useMemo(() => {
    if (!members || !usuario) return { isOwnerMaster: false, masterCount: 0 };
    const isMaster = members.some(m => m.usuario?.id === usuario.id && m.permissao === 'proprietario_master');
    const count = members.filter(m => m.permissao === 'proprietario_master').length;
    return { isOwnerMaster: isMaster, masterCount: count };
  }, [members, usuario]);

  /**
   * Submete a alteração de permissão de um membro.
   */
  const executePermissionChange = useCallback(async (vinculoId, novaPermissao) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Atualizando permissão...');
    try {
      await api.put(`/permission/${vinculoId}`, { permissao: novaPermissao });
      toast.success('Permissão atualizada!', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível atualizar a permissão.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
      setPermissionChangeRequest(null);
    }
  }, [fetchData]);

  const requestPermissionChange = useCallback((vinculoId, novaPermissao) => {
    const member = members.find(m => m.id === vinculoId);
    if (!member) return;
    if (novaPermissao === 'proprietario_master' && member.permissao !== 'proprietario_master') {
      setPermissionChangeRequest({ vinculoId, novaPermissao, memberName: member.usuario?.nomeCompleto || 'o membro' });
    } else {
      executePermissionChange(vinculoId, novaPermissao);
    }
  }, [members, executePermissionChange]);

  const confirmPermissionChange = useCallback(() => {
    if (permissionChangeRequest) {
      executePermissionChange(permissionChangeRequest.vinculoId, permissionChangeRequest.novaPermissao);
    }
  }, [permissionChangeRequest, executePermissionChange]);
  
  /**
   * Submete a alteração do número de frações.
   */
  const handleSaveFracoes = useCallback(async (vinculoId) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Salvando alteração...');
    try {
      await api.put(`/permission/cota/${vinculoId}`, { numeroDeFracoes: parseInt(fracaoValue, 10) || 0 });
      toast.success('Frações atualizadas com sucesso!', { id: loadingToast });
      setEditingFracaoId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível salvar.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchData, fracaoValue]);

  /**
   * Executa a desvinculação de um membro.
   */
  const handleConfirmUnlink = useCallback(async () => {
    if (!memberToUnlink || isSubmitting) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading(`Desvinculando ${memberToUnlink.usuario.nomeCompleto}...`);
    try {
      await api.delete(`/permission/unlink/member/${memberToUnlink.id}`);
      toast.success("Membro desvinculado com sucesso!", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível desvincular o membro.", { id: loadingToast });
    } finally {
      setMemberToUnlink(null);
      setIsSubmitting(false);
    }
  }, [memberToUnlink, fetchData, isSubmitting]);

  if (loading) { /* ... renderiza o loader ... */ }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx("flex-1 p-4 sm:p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
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
                <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
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
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Frações</th>
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
                              disabled={isSubmitting || (member.usuario?.id === usuario?.id && permissionData.masterCount <= 1)}
                              className="text-sm font-semibold border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-transparent p-1"
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
                          {editingFracaoId === member.id ? (
                            <input type="number" value={fracaoValue} onChange={(e) => setFracaoValue(e.target.value)} className="w-24 p-1 border rounded-md" min="0" step="1"/>
                          ) : (
                            `${member.numeroDeFracoes}`
                          )}
                        </td>
                        {permissionData.isOwnerMaster && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-4">
                              {editingFracaoId === member.id ? (
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => handleSaveFracoes(member.id)} disabled={isSubmitting} className="text-green-600 hover:text-green-800 disabled:opacity-50"><Save size={20} /></button>
                                  <button onClick={() => setEditingFracaoId(null)} disabled={isSubmitting} className="text-red-600 hover:text-red-800 disabled:opacity-50"><X size={20} /></button>
                                </div>
                              ) : (
                                <>
                                  {member.usuario?.id !== usuario?.id && (
                                    <button onClick={() => setMemberToUnlink(member)} disabled={isSubmitting} className="text-red-600 hover:text-red-800 disabled:opacity-50" title="Desvincular Membro"><Trash2 size={18} /></button>
                                  )}
                                  <button onClick={() => { setEditingFracaoId(member.id); setFracaoValue(member.numeroDeFracoes); }} disabled={isSubmitting} className="text-gold hover:text-black font-medium text-sm disabled:opacity-50">Editar Frações</button>
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
                          Frações a ceder: {invite.numeroDeFracoes}
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
      
      <Dialog isOpen={!!memberToUnlink} onClose={() => setMemberToUnlink(null)} title="Confirmar Desvinculação de Cotista">
        <div className="p-6">
            <p className="text-gray-700 mb-6 text-lg">
                Tem certeza que deseja desvincular <strong>{memberToUnlink?.usuario.nomeCompleto}</strong>? As frações dele(a) serão transferidas para você.
            </p>
            <div className="flex justify-end gap-4">
                <button disabled={isSubmitting} onClick={() => setMemberToUnlink(null)} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50">Cancelar</button>
                <button disabled={isSubmitting} onClick={handleConfirmUnlink} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center justify-center w-52 disabled:bg-gray-400">
                    {isSubmitting ? <Loader2 className="animate-spin"/> : <><Trash2 size={16} /> Confirmar Desvinculação</>}
                </button>
            </div>
        </div>
      </Dialog>
      <Dialog isOpen={!!permissionChangeRequest} onClose={() => setPermissionChangeRequest(null)} title="Confirmar Alteração de Permissão">
        <div className="p-6">
          <div className="flex items-start sm:items-center gap-4 mb-4">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full"><AlertTriangle className="h-6 w-6 text-yellow-600" /></div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Tem certeza que deseja promover "{permissionChangeRequest?.memberName}" para <strong>Proprietário Master</strong>?
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6 sm:pl-16">Esta permissão concede acesso total ao gerenciamento da propriedade.</p>
          <div className="flex justify-end gap-4">
            <button disabled={isSubmitting} onClick={() => setPermissionChangeRequest(null)} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50">Cancelar</button>
            <button disabled={isSubmitting} onClick={confirmPermissionChange} className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition flex items-center justify-center w-36 disabled:bg-gray-400">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar'}
            </button>
          </div>
        </div>
      </Dialog>
      
      <InviteMemberModal isOpen={isInviteModalOpen} onClose={() => { setIsInviteModalOpen(false); fetchData(); }} propertyId={Number(propertyId)} />
    </>
  );
};

export default PropertyMembersPage;