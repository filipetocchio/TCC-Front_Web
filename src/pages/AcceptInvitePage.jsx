/**
 * @file AcceptInvitePage.jsx
 * @description Página pública onde um usuário pode visualizar e aceitar um convite para uma propriedade.
 */
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import { Mail, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const AcceptInvitePage = () => {
  const { token } = useParams();
  const { usuario, token: authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(`${API_URL}/invite/verify/${token}`);
        setInviteDetails(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Ocorreu um erro ao verificar o convite.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleAccept = async () => {
    const loadingToast = toast.loading('Aceitando convite...');
    try {
      await axios.post(`${API_URL}/invite/accept/${token}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Convite aceito com sucesso! Bem-vindo(a)!', { id: loadingToast });
      navigate(paths.home);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Não foi possível aceitar o convite.', { id: loadingToast });
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>;
    }
    if (error) {
      return (
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Convite Inválido</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link to={paths.login} className="mt-6 inline-block px-6 py-2 bg-black text-white rounded-lg font-semibold">
            Ir para o Login
          </Link>
        </div>
      );
    }
    if (inviteDetails) {
      const isUserAuthenticated = !!usuario;
      const userNeedsToRegister = !inviteDetails.userExists && !isUserAuthenticated;
      const userNeedsToLogin = inviteDetails.userExists && !isUserAuthenticated;

      return (
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-4 text-2xl font-bold">Você foi convidado!</h2>
          <p className="mt-2 text-gray-600">
            <span className="font-semibold">{inviteDetails.convidadoPor}</span> convidou você ({inviteDetails.emailConvidado}) para se juntar à propriedade <span className="font-semibold">{inviteDetails.propriedade}</span>.
          </p>
          
          {isUserAuthenticated && (
            <button onClick={handleAccept} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
              <CheckCircle size={20} /> Aceitar Convite
            </button>
          )}

          {userNeedsToLogin && (
            <Link to={paths.login} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
              <LogIn size={20} /> Fazer Login para Aceitar
            </Link>
          )}

          {userNeedsToRegister && (
            <Link to={paths.cadastro} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
              <UserPlus size={20} /> Criar Conta para Aceitar
            </Link>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default AcceptInvitePage;