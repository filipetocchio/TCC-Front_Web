// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Aceitação de Convite
 *
 * Descrição:
 * Este arquivo define a página pública onde um usuário pode visualizar e aceitar um
 * convite para se juntar a uma propriedade.
 *
 * Fluxo de Lógica:
 * 1.  Extrai o token de convite da URL e o envia para a API para verificação.
 * 2.  Com base na resposta da API, exibe os detalhes do convite (quem convidou,
 * para qual propriedade e por quantas frações).
 * 3.  Guia o usuário para a ação correta:
 * - Se já estiver logado, exibe o botão "Aceitar Convite".
 * - Se o e-mail do convite já tem uma conta mas o usuário não está logado,
 * direciona para o login.
 * - Se o e-mail é novo, direciona para a página de cadastro.
 * 4.  Fornece feedback visual durante as operações de rede.
 */
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import api from '../services/api';
import { Mail, CheckCircle, XCircle, LogIn, UserPlus, Loader2 } from 'lucide-react';

/**
 * Componente principal da página de aceitação de convite.
 */
const AcceptInvitePage = () => {
  const { token } = useParams();
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Gerenciamento de Estado ---
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Efeito para verificar a validade do token de convite ao carregar a página.
   */
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/invite/verify/${token}`);
        setInviteDetails(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Ocorreu um erro ao verificar o convite.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  /**
   * Processa a aceitação do convite, enviando a requisição para a API.
   */
  const handleAccept = useCallback(async () => {
    if (isAccepting) return;
    
    setIsAccepting(true);
    const loadingToast = toast.loading('Aceitando convite...');
    
    try {
      await api.post(`/invite/accept/${token}`);
      toast.success('Convite aceito com sucesso! Bem-vindo(a)!', { id: loadingToast });
      navigate(paths.home);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Não foi possível aceitar o convite.', { id: loadingToast });
      setIsAccepting(false);
    }
  }, [token, navigate, isAccepting]);

  /**
   * Renderiza o conteúdo da página com base no estado da verificação do token.
   */
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
            <span className="font-semibold">{inviteDetails.convidadoPor}</span> convidou você ({inviteDetails.emailConvidado}) para se juntar à propriedade <span className="font-semibold">{inviteDetails.propriedade}</span>, recebendo <span className="font-semibold">{inviteDetails.numeroDeFracoes}</span> fração(ões).
          </p>
          
          {isUserAuthenticated && (
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {isAccepting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              {isAccepting ? 'Processando...' : 'Aceitar Convite'}
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