/**
 * @file PropertyMembersPage.jsx
 * @description Página para visualização e gerenciamento de membros e convites de uma propriedade.
 */
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import InviteMemberModal from '../components/members/InviteMemberModal';
import { Users, Mail, UserPlus, Clock, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const PropertyMembersPage = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const [property, setProperty] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [propertyResponse, invitesResponse] = await Promise.all([
          axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/invite/property/${propertyId}/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setProperty(propertyResponse.data.data);
        setMembers(propertyResponse.data.data.usuarios || []);
        setPendingInvites(invitesResponse.data.data || []);
      } catch (error) {
        toast.error("Não foi possível carregar os dados dos membros.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId, token]);

  const isOwnerMaster = members.some(m => m.id === usuario?.id && m.permissao === 'proprietario_master');

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
            <Link to={`/property/${propertyId}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4">
              <ArrowLeft size={16} /> Voltar para a Propriedade
            </Link>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{property?.nomePropriedade}</h1>
                <p className="text-gray-500">Gerenciamento de Cotistas e Convites</p>
              </div>
              {isOwnerMaster && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  <UserPlus size={18} />Convidar Novo Membro
                </button>
              )}
            </div>

            {/* Seção de Membros Atuais */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users size={22} /> Membros Atuais</h2>
              <ul className="divide-y divide-gray-200">
                {members.map(member => (
                  <li key={member.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <p className="font-medium text-gray-900">{member.nomeCompleto}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full mt-2 sm:mt-0">
                      {member.permissao === 'proprietario_master' ? 'Proprietário Master' : 'Proprietário Comum'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Seção de Convites Pendentes */}
            {isOwnerMaster && (
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
                        {/* Ação de revogar pode ser adicionada aqui no futuro */}
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
      <InviteMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} propertyId={Number(propertyId)} token={token} />
    </>
  );
};

export default PropertyMembersPage;