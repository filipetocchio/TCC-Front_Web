import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Importando o hook useNavigate

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();  // Inicializando o hook navigate

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/home');  // Usando o navigate para redirecionar
      } else {
        setError(data.message || 'Erro ao realizar login');
      }
    } catch  {
      setError('Erro de conexão com o servidor');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-gold">
        <h2 className="text-3xl font-bold text-center text-text-on-gold mb-6">QOTA - Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-text-on-gold">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 bg-white text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-text-on-gold">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 bg-white text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 mt-4 text-white bg-black rounded-md hover:bg-gray-800 transition duration-200"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-text-on-gold">
          Não tem uma conta?{' '}
          <a href="/cadastro" className="underline hover:text-black transition duration-200">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
