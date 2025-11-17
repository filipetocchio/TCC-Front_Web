// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Descrição:
 * Este componente renderiza a interface de login da aplicação. Ele é responsável
 * por gerenciar o estado local dos campos de entrada (e-mail e senha),
 * processar a submissão do formulário, interagir com a API de autenticação
 * e fornecer feedback visual ao usuário (carregamento e mensagens de erro).
 *
 * Em caso de sucesso na autenticação, ele utiliza o AuthContext para atualizar
 * o estado global da aplicação e redireciona o usuário para a página principal.
 */

import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
// Importa a instância da API e rotas
import api from '@/services/api.js'; 
import paths from '../../routes/paths';
// Importa recursos visuais (imagens e ícones)
import LoginImage from '../../assets/login.png';
import SuaLogo from '../../assets/Ln QOTA Branca.png';
import { Mail, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const LoginForm = () => {
  // --- 1. Gerenciamento de Estado Local ---
  // Armazena as credenciais inseridas pelo usuário.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Controla o estado de carregamento para desabilitar o botão
  // e exibir o spinner durante a requisição.
  const [isLoading, setIsLoading] = useState(false);
  
  // Armazena a mensagem de feedback (erro ou sucesso)
  // a ser exibida para o usuário.
  const [statusMessage, setStatusMessage] = useState(null);

  // --- 2. Hooks e Contexto ---
  // Hook para navegação programática (redirecionamento).
  const navigate = useNavigate();
  // Obtém a função 'login' do contexto global de autenticação.
  const { login } = useContext(AuthContext);

  /**
   * Processa a submissão do formulário de login quando o usuário
   * clica no botão "Entrar".
   *
   * @param {React.FormEvent} e O evento de submissão do formulário.
   */
  const handleSubmit = async (e) => {
    // Previne o comportamento padrão do navegador de recarregar a página.
    e.preventDefault();
    // Previne submissões múltiplas enquanto uma já está em processamento.
    if (isLoading) return; 

    // Ativa o estado de carregamento e limpa mensagens anteriores.
    setIsLoading(true);
    setStatusMessage(null);

    try {
      // --- 3. Requisição à API ---
      // Envia as credenciais para o endpoint de autenticação.
      const loginResponse = await api.post('/auth/login', { email, password });
      
      // Desestrutura a resposta da API (conforme definido no backend).
      // O 'loginResponse.data.data' contém o objeto do usuário e o token.
      const { accessToken, ...userData } = loginResponse.data.data;
      
      // --- 4. Atualização de Estado Global ---
      // Chama a função 'login' do AuthContext para salvar os dados do
      // usuário e o token globalmente e no localStorage.
      login(userData, accessToken);

      // --- 5. Redirecionamento ---
      // Navega o usuário para a página inicial (home) após o sucesso.
      navigate(paths.home);

    } catch (error) {
      // --- 6. Tratamento de Erros ---
      // Exibe a mensagem de erro vinda da API ou uma mensagem padrão.
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'E-mail ou senha inválidos. Verifique suas credenciais.',
      });
    } finally {
      // --- 7. Conclusão ---
      // Garante que o estado de carregamento seja desativado,
      // independentemente de sucesso ou falha.
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* --- Seção do Formulário (Esquerda) --- */}
      <div className="w-full md:w-1/3 flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md p-8 bg-gold-gradient-vertical rounded-2xl shadow-xl">
          
          {/* Logo */}
          <div className="flex justify-center mb-0">
            <img src={SuaLogo} alt="Logo QOTA" className="h-64" />
          </div>
          
          <h2 className="text-xl font-semibold text-center text-white mb-6">Acesso ao Sistema</h2>

          {/* Bloco de Mensagem de Status (Erro) */}
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

          {/* Início do Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo de E-mail */}
            <div>
              <label htmlFor="email" className="block text-text-on-dark font-medium mb-1">Email</label>
              <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
                <Mail className="text-gray-600" size={20} />
                <input
                  type="email"
                  id="email" // 'id' corresponde ao 'htmlFor' para acessibilidade.
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required // Ativa a validação HTML5.
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
                  id="password" // 'id' corresponde ao 'htmlFor' para acessibilidade.
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required // Ativa a validação HTML5.
                  placeholder="Digite sua senha"
                  className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              className="w-full py-2 bg-gold text-white font-semibold rounded-md hover:bg-transparent hover:text-gold hover:border hover:border-gold transition duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading} // Desabilita o botão durante o carregamento.
            >
              {isLoading ? (
                // Exibe o spinner de carregamento.
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Link para Cadastro */}
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

      {/* --- Seção da Imagem (Direita) --- */}
      {/* 'hidden md:block' garante que a imagem seja exibida
           apenas em telas de tamanho médio ou maiores. */}
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