import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Importar o 'Link'
import axios from 'axios';
import toast from 'react-hot-toast'; // 2. Importar o 'toast'
import paths from '../routes/paths';
import { Mail, Lock, User, Smartphone, IdCard } from 'lucide-react';

// Define a URL base da API para facilitar a manutenção
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const RegisterUser = () => {
  // Estado que armazena os dados do formulário de cadastro
  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    telefone: '',
    cpf: '',
  });

  // 3. Novo estado para controlar o checkbox de consentimento
  const [termosAceitos, setTermosAceitos] = useState(false);
  
  const navigate = useNavigate();

  // Atualiza os valores do formulário conforme o usuário digita, com tratamento para CPF e Telefone
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Remove caracteres não numéricos para CPF e Telefone
    if (name === 'cpf' || name === 'telefone') {
      setForm({ ...form, [name]: value.replace(/\D/g, '') });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // 4. Função de submit atualizada com 'toast' e envio do consentimento
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Realizando cadastro...');

    try {
      // Requisição POST para cadastrar o usuário, incluindo o campo 'termosAceitos'
      await axios.post(`${API_URL}/auth/register`, {
        ...form,
        termosAceitos,
      });

      toast.success('Cadastro realizado com sucesso! Redirecionando...', { id: loadingToast });
      setTimeout(() => navigate(paths.login), 2000);

    } catch (error) {
      // Exibe a mensagem de erro vinda diretamente da API
      toast.error(error.response?.data?.message || 'Não foi possível concluir o cadastro.', { id: loadingToast });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary px-4">
      <div className="w-full max-w-md p-8 bg-gold rounded-2xl shadow-xl">
        <h1 className="text-4xl font-extrabold text-center mb-4 text-text-on-gold">QOTA</h1>
        <h2 className="text-xl font-semibold text-center text-text-on-gold mb-6">Cadastro de Usuário</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Nome Completo */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Nome Completo</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <User className="text-gray-600" size={20} />
              <input type="text" name="nomeCompleto" value={form.nomeCompleto} onChange={handleChange} required placeholder="Digite seu nome completo" className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none" />
            </div>
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Email</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Mail className="text-gray-600" size={20} />
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="exemplo@email.com" className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none" />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Senha</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Lock className="text-gray-600" size={20} />
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none" />
            </div>
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Telefone</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Smartphone className="text-gray-600" size={20} />
              <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} placeholder="DDD + número (somente dígitos)" maxLength={11} className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none" />
            </div>
          </div>

          {/* Campo CPF */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">CPF</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <IdCard className="text-gray-600" size={20} />
              <input type="text" name="cpf" value={form.cpf} onChange={handleChange} required placeholder="Apenas números (11 dígitos)" maxLength={11} className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none" />
            </div>
          </div>

          {/* 5. SEÇÃO DE CONSENTIMENTO LGPD */}
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
                </Link>
                .
              </label>
            </div>
          </div>
          
          {/* 6. BOTÃO ATUALIZADO COM LÓGICA 'disabled' */}
          <button
            type="submit"
            disabled={!termosAceitos}
            className="w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Cadastrar
          </button>
        </form>

        <p className="mt-4 text-center text-text-on-gold">
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