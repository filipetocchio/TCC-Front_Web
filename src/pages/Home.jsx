// src/pages/Home.jsx
import Sidebar from '../components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
     // const token = localStorage.getItem('token');

    // Comentado para permitir navegação sem autenticação, remova este bloco se desejar ativar proteção
    // if (!token) return navigate('/login');
    // const userData = JSON.parse(localStorage.getItem('usuario'));
    // if (!userData) return navigate('/login');
    // setUser(userData);

    // Temporário para desenvolvimento do layout
    const userData = { nomeCompleto: "Usuário Teste" };
    setUser(userData);
  }, [navigate]);

  return (
    <div className="flex">
      <Sidebar user={user} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Bem-vindo à sua Dashboard</h1>

        {/* Botão profissional para cadastro de propriedade */}
        <Link
          to="/RegistrarPropriedade"
          className="inline-block px-6 py-3 bg-black text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all duration-300 shadow-md"
        >
          + Cadastrar Nova Propriedade
        </Link>
      </main>
    </div>
  );
};

export default Home;
