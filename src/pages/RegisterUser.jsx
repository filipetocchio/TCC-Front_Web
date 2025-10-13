// Todos direitos autorais reservados pelo QOTA.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import paths from '../routes/paths';
import api from '../services/api'; // Utiliza o serviço de API centralizado.
import Input from '../components/ui/Input'; // Importa o componente de UI reutilizável.
import { Mail, Lock, User, Smartphone, IdCard } from 'lucide-react';

/**
 * @page RegisterUser
 * @description Página de cadastro para novos usuários. Coleta as informações
 * necessárias e as submete à API para a criação de uma nova conta.
 */
const RegisterUser = () => {
  // Estado que armazena os dados do formulário de cadastro.
  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    telefone: '',
    cpf: '',
  });

  // Estado para controlar o aceite dos termos de uso e política de privacidade.
  const [termosAceitos, setTermosAceitos] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Atualiza o estado do formulário conforme o usuário digita.
   * Inclui tratamento para remover caracteres não numéricos dos campos de CPF e Telefone.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Remove caracteres não numéricos para os campos específicos.
    if (name === 'cpf' || name === 'telefone') {
      setForm({ ...form, [name]: value.replace(/\D/g, '') });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /**
   * Manipula a submissão do formulário.
   * Envia os dados para a API e trata as respostas de sucesso ou erro.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Realizando cadastro...');

    try {
      // Requisição POST para a rota de registro, utilizando a instância 'api'.
      await api.post('/auth/register', {
        ...form,
        termosAceitos,
      });

      toast.success('Cadastro realizado com sucesso! Redirecionando...', { id: loadingToast });
      setTimeout(() => navigate(paths.login), 2000);

    } catch (error) {
      // Exibe a mensagem de erro vinda diretamente da API.
      toast.error(error.response?.data?.message || 'Não foi possível concluir o cadastro.', { id: loadingToast });
    }
  };

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

          {/* Seção de consentimento LGPD */}
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
          
          {/* Botão de submissão com lógica 'disabled' baseada no aceite dos termos. */}
          <button
            type="submit"
            disabled={!termosAceitos}
            className="w-full py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Cadastrar
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