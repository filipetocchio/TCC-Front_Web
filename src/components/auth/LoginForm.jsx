// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente de Formulário de Login
 *
 * Descrição:
 * Este arquivo contém o componente React responsável pela interface e lógica de
 * autenticação do usuário. Ele gerencia o estado dos campos de e-mail e senha,
 * lida com a submissão do formulário, comunica-se com a API de login e fornece
 * feedback visual ao usuário durante o processo.
 *
 * O componente utiliza o AuthContext para gerenciar o estado de autenticação
 * global da aplicação após um login bem-sucedido.
 */
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import paths from '../../routes/paths';
import LoginImage from '../../assets/login.png';
import SuaLogo from '../../assets/Ln QOTA Branca.png';
import { Mail, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const LoginForm = () => {
  // --- Gerenciamento de Estado ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento.
  const [statusMessage, setStatusMessage] = useState(null); // Estado para mensagens de erro ou sucesso.

  // Hooks para navegação e contexto de autenticação.
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  /**
   * Processa a submissão do formulário de login.
   * Envia as credenciais para a API e gerencia o estado da aplicação
   * com base na resposta.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Impede envios múltiplos durante o carregamento.

    setIsLoading(true);
    setStatusMessage(null);

    try {
      // --- 1. Requisição para a API de Login ---
      const loginResponse = await api.post('/auth/login', { email, password });
      const { accessToken, ...userData } = loginResponse.data.data;
      
      // --- 2. Atualização do Contexto de Autenticação ---
      // Salva os dados do usuário e o token no estado global da aplicação.
      login(userData, accessToken);

      // --- 3. Redirecionamento ---
      // Navega o usuário para a página principal após o login.
      navigate(paths.home);
    } catch (error) {
      // --- Tratamento de Erros ---
      // Exibe uma mensagem de erro para o usuário.
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'E-mail ou senha inválidos. Verifique suas credenciais.',
      });
    } finally {
      // Garante que o estado de carregamento seja desativado ao final do processo.
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Seção do Formulário (Esquerda) */}
      <div className="w-full md:w-1/3 flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md p-8 bg-gold-gradient-vertical rounded-2xl shadow-xl">
          
          <div className="flex justify-center mb-0">
            <img src={SuaLogo} alt="Logo QOTA" className="h-64" />
          </div>
          
          <h2 className="text-xl font-semibold text-center text-white mb-6">Acesso ao Sistema</h2>

          {/* Componente para exibir mensagens de status (erro) */}
          {statusMessage && (
            <div
              className={`flex items-center gap-2 p-4 rounded-md mb-4 border ${
                statusMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 border-green-400'
                  : 'bg-red-100 text-red-800 border-red-400'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de E-mail */}
            <div>
              <label htmlFor="email" className="block text-text-on-dark font-medium mb-1">Email</label>
              <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
                <Mail className="text-gray-600" size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Digite seu email"
                  className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div>
              <label htmlFor="password" className="block text-text-on-dark font-medium mb-1">Senha</label>
              <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
                <Lock className="text-gray-600" size={20} />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digite sua senha"
                  className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Botão de Submissão com Feedback de Carregamento */}
            <button
              type="submit"
              className="w-full py-2 bg-gold text-white font-semibold rounded-md hover:bg-transparent hover:text-gold hover:border hover:border-gold transition duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-text-on-dark">
            Não tem uma conta?{' '}
            <a
              href={paths.cadastro}
              className="font-semibold text-text-on-dark hover:underline hover:text-white transition duration-200"
            >
              Cadastre-se
            </a>
          </p>
        </div>
      </div>

      {/* Seção da Imagem (Direita) */}
      <div className="hidden md:block w-2/3 h-screen">
        <img
          src={LoginImage}
          alt="Login background"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default LoginForm;