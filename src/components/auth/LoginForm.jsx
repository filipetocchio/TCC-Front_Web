import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import paths from '../../routes/paths';
import { Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const LoginForm = () => {
  // =====================
  // Estados do componente
  // =====================
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const navigate = useNavigate();

  // =============================
  // Manipulador de envio do form
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null); // Limpa mensagens anteriores

    try {
      const response = await axios.post('http://localhost:8001/api/v1/auth/login', {
        email,
        password: senha,
      });

      const { accessToken, id, email: userEmail } = response.data.data;

      // Armazena token e dados do usuário
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('usuario', JSON.stringify({ id, email: userEmail }));

      // Dispara evento para sincronizar estado entre abas/componentes
      window.dispatchEvent(new Event('storage'));

      // Redireciona para home
      navigate(paths.home);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Email ou senha inválidos',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary px-4">
      <div className="w-full max-w-md p-8 bg-gold rounded-2xl shadow-xl">
        <h1 className="text-4xl font-extrabold text-center mb-4 text-text-on-gold">QOTA</h1>
        <h2 className="text-xl font-semibold text-center text-text-on-gold mb-6">Acesso ao Sistema</h2>

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
          {/* Campo: Email */}
          <div>
            <label htmlFor="email" className="block text-text-on-gold font-medium mb-1">
              Email
            </label>
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

          {/* Campo: Senha */}
          <div>
            <label htmlFor="senha" className="block text-text-on-gold font-medium mb-1">
              Senha
            </label>
            <div className="flex items-center border border-black rounded-md px-3 py-2 bg-white gap-2">
              <Lock className="text-gray-600" size={20} />
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Digite sua senha"
                className="w-full bg-white text-gray-700 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Botão: Entrar */}
          <button
            type="submit"
            className="w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 shadow-md"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-text-on-gold">
          Não tem uma conta?{' '}
          <a
            href={paths.cadastro}
            className="font-semibold text-text-on-gold hover:underline hover:text-black transition duration-200"
          >
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
