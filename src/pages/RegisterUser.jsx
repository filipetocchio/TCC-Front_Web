import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import paths from '../routes/paths';
import { Mail, Lock, User, Smartphone, IdCard, CheckCircle, AlertTriangle } from 'lucide-react';

const RegisterUser = () => {
  // Estado que armazena os dados do formulário de cadastro
  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    telefone: '',
    cpf: '',
  });

  // Estado para armazenar mensagens de erro de validação dos campos
  const [errors, setErrors] = useState({});
  
  // Estado para controle de mensagens de sucesso ou erro de cadastro
  const [statusMessage, setStatusMessage] = useState(null);
  
  const navigate = useNavigate();

  // Função de validação dos campos antes do envio
  const validate = () => {
    const newErrors = {};
    if (!form.nomeCompleto.trim()) newErrors.nomeCompleto = 'Nome completo é obrigatório.';
    if (!form.email.includes('@')) newErrors.email = 'Formato de email inválido.';
    if (form.password.length < 6) newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
    if (!/^\d{11}$/.test(form.cpf)) newErrors.cpf = 'CPF deve conter exatamente 11 dígitos.';
    if (!/^\d{10,11}$/.test(form.telefone)) newErrors.telefone = 'Telefone deve conter DDD e 10 ou 11 dígitos.';
    return newErrors;
  };

  // Atualiza os valores do formulário conforme o usuário digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Submete o formulário e envia os dados ao backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Requisição POST para cadastrar o usuário
      await axios.post('http://localhost:8001/api/v1/auth/register', form, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Mensagem de sucesso profissional
      setStatusMessage({
        type: 'success',
        text: 'Cadastro realizado com sucesso! Redirecionando para o login...',
      });

      // Redireciona após pequena pausa para exibir a mensagem
      setTimeout(() => navigate(paths.login), 2000);
    } catch  {
      // Mensagem de erro amigável e clara
      setStatusMessage({
        type: 'error',
        text: 'Não foi possível concluir o cadastro. Verifique seus dados e tente novamente.',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary px-4">
      <div className="w-full max-w-md p-8 bg-gold rounded-2xl shadow-xl">
        {/* Título principal da plataforma */}
        <h1 className="text-4xl font-extrabold text-center mb-4 text-text-on-gold">QOTA</h1>

        {/* Subtítulo da tela de cadastro */}
        <h2 className="text-xl font-semibold text-center text-text-on-gold mb-6">Cadastro de Usuário</h2>

        {/* Mensagem de status (sucesso ou erro) */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-4 rounded-md mb-4 ${
              statusMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Formulário de cadastro */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Nome Completo */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Nome Completo</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <User className="text-gray-600" size={20} />
              <input
                type="text"
                name="nomeCompleto"
                value={form.nomeCompleto}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
            {errors.nomeCompleto && <p className="text-red-600 text-sm">{errors.nomeCompleto}</p>}
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Email</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Mail className="text-gray-600" size={20} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Senha</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Lock className="text-gray-600" size={20} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
            {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">Telefone</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Smartphone className="text-gray-600" size={20} />
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value.replace(/\D/g, '') })}
                placeholder="DDD + número (somente dígitos)"
                maxLength={11}
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
            {errors.telefone && <p className="text-red-600 text-sm">{errors.telefone}</p>}
          </div>

          {/* Campo CPF */}
          <div>
            <label className="block text-text-on-gold font-medium mb-1">CPF</label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <IdCard className="text-gray-600" size={20} />
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '') })}
                placeholder="Apenas números (11 dígitos)"
                maxLength={11}
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
            {errors.cpf && <p className="text-red-600 text-sm">{errors.cpf}</p>}
          </div>

          {/* Botão de envio */}
          <button
            type="submit"
            className="w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 shadow-md"
          >
            Cadastrar
          </button>
        </form>

        {/* Link para login */}
        <p className="mt-4 text-center text-text-on-gold">
          Já possui uma conta?{' '}
          <a
            href={paths.login}
            className="font-semibold text-text-on-gold hover:underline hover:text-black transition duration-200"
          >
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;
