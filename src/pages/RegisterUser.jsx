// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Cadastro de Usuário
 *
 * Descrição:
 * Este arquivo define a página de registro para novos usuários. O componente gerencia
 * um formulário com validação de entrada, lida com a submissão dos dados para a API
 * de registro e, em caso de sucesso, autentica o usuário automaticamente e o
 * redireciona para a página principal da aplicação.
 *
 * Funcionalidades:
 * - Coleta de dados do usuário (nome, e-mail, senha, etc.).
 * - Validação de consentimento com os Termos de Uso e Política de Privacidade.
 * - Feedback visual durante o processo de submissão (estado de carregamento).
 * - Tratamento de erros com mensagens claras para o usuário.
 * - Integração com o AuthContext para iniciar a sessão do usuário após o cadastro.
 */
import { useState, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import api from '../services/api';
import Input from '../components/ui/Input';
import { Mail, Lock, User, Smartphone, IdCard, Loader2 } from 'lucide-react';

const RegisterUser = () => {
  // --- Gerenciamento de Estado ---
  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    telefone: '',
    cpf: '',
  });
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Hooks ---
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  /**
   * Atualiza o estado do formulário de forma otimizada.
   * Remove caracteres não numéricos dos campos de CPF e Telefone.
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const isNumericField = name === 'cpf' || name === 'telefone';
    
    setForm(prevForm => ({
      ...prevForm,
      [name]: isNumericField ? value.replace(/\D/g, '') : value,
    }));
  }, []);

  /**
   * Processa a submissão do formulário de registro.
   * Envia os dados para a API, autentica o usuário em caso de sucesso
   * e trata possíveis erros.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const loadingToast = toast.loading('Realizando cadastro...');

    try {
      // --- 1. Requisição para a API de Registro ---
      const response = await api.post('/auth/register', { ...form, termosAceitos });
      const { accessToken, ...userData } = response.data.data;

      // --- 2. Autenticação e Redirecionamento ---
      // Autentica o usuário recém-criado na aplicação.
      login(userData, accessToken);

      toast.success('Cadastro realizado com sucesso!', { id: loadingToast });
      
      // Redireciona o usuário diretamente para a página principal.
      navigate(paths.home);

    } catch (error) {
      // Exibe a mensagem de erro vinda da API.
      toast.error(error.response?.data?.message || 'Não foi possível concluir o cadastro.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  }, [form, termosAceitos, isLoading, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary px-4 py-8">
      <div className="w-full max-w-md p-8 bg-gold rounded-2xl shadow-xl">
        <h1 className="text-4xl font-extrabold text-center mb-4 text-text-on-gold">QOTA</h1>
        <h2 className="text-xl font-semibold text-center text-text-on-gold mb-6">Cadastro de Usuário</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo"
            id="nomeCompleto"
            name="nomeCompleto"
            value={form.nomeCompleto}
            onChange={handleChange}
            required
            placeholder="Digite seu nome completo"
            Icon={User}
          />
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="exemplo@email.com"
            Icon={Mail}
          />
          <Input
            label="Senha"
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Mínimo 6 caracteres"
            Icon={Lock}
          />
          <Input
            label="Telefone"
            id="telefone"
            name="telefone"
            type="tel"
            value={form.telefone}
            onChange={handleChange}
            placeholder="DDD + número (somente dígitos)"
            maxLength={11}
            Icon={Smartphone}
          />
          <Input
            label="CPF"
            id="cpf"
            name="cpf"
            type="text"
            value={form.cpf}
            onChange={handleChange}
            required
            placeholder="Apenas números (11 dígitos)"
            maxLength={11}
            Icon={IdCard}
          />

          {/* Seção de consentimento (LGPD) */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              id="termos"
              name="termos"
              type="checkbox"
              checked={termosAceitos}
              onChange={(e) => setTermosAceitos(e.target.checked)}
              className="h-5 w-5 mt-0.5 rounded border-gray-400 text-gold focus:ring-black cursor-pointer"
            />
            <div className="text-sm">
              <label htmlFor="termos" className="font-medium text-text-on-gold">
                Eu li e concordo com os{' '}
                <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition-colors">
                  Termos de Uso
                </Link>
                {' '}e a{' '}
                <Link to="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition-colors">
                  Política de Privacidade
                </Link>.
              </label>
            </div>
          </div>
          
          {/* Botão de submissão com feedback de carregamento */}
          <button
            type="submit"
            disabled={!termosAceitos || isLoading}
            className="w-full py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-text-on-gold">
          Já possui uma conta?{' '}
          <Link to={paths.login} className="font-semibold text-text-on-gold hover:underline hover:text-black transition duration-200">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;