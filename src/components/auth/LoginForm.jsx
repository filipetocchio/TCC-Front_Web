import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import paths from '../../routes/paths';
import { Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import LoginImage from '../../assets/login.png'; // importa a imagem
import SuaLogo from '../../assets/Ln QOTA Branca.png'; // <--- CAMINHO CORRIGIDO

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const response = await axios.post('http://localhost:8001/api/v1/auth/login', {
        email,
        password: senha,
      });

      const { accessToken, id, email: userEmail } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('usuario', JSON.stringify({ id, email: userEmail }));
      window.dispatchEvent(new Event('storage'));

      navigate(paths.home);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Email ou senha inválidos',
      });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Formulário à esquerda - 30% */}
      <div className="w-full md:w-1/3 flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md p-8 bg-gold-gradient-vertical rounded-2xl shadow-xl">
          {/* 2. ADICIONE A TAG IMG PARA A LOGO AQUI */}
          <div className="flex justify-center mb-0"> {/* Container para centralizar a logo e adicionar margem inferior */}
            <img src={SuaLogo} alt="Logo QOTA" className="h-64" /> {/* Ajuste a classe 'h-16' para o tamanho desejado */}
          </div>

          
          <h2 className="text-xl font-semibold text-center text-white mb-6">Acesso ao Sistema</h2>

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

            <div>
              <label htmlFor="senha" className="block text-text-on-dark font-medium mb-1">Senha</label>
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

            <button
              type="submit"
              className="w-full py-2 bg-gold text-white font-semibold rounded-md hover:bg-transparent hover:text-gold hover:border hover:border-gold transition duration-300 shadow-md"
            >
              Entrar
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

      {/* Imagem à direita - 70% */}
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