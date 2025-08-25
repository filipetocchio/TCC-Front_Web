import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/layout/Sidebar';
import paths from '../routes/paths';
import { Home as HomeIcon, Building2, MapPin, Archive } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// ALTERAÇÃO 1: Importar a imagem da pasta 'assets' para uma variável.
// O caminho '../assets/' é relativo à localização do seu arquivo Home.jsx (src/pages/).
import logoQota from '../assets/Ln QOTA.png';

// Ícones mapeados por tipo de propriedade
const iconMap = {
  Casa: <HomeIcon className="inline-block mr-1" size={16} />,
  Apartamento: <Building2 className="inline-block mr-1" size={16} />,
  Chácara: <MapPin className="inline-block mr-1" size={16} />,
  Lote: <Archive className="inline-block mr-1" size={16} />,
  Outros: <HomeIcon className="inline-block mr-1" size={16} />
};

const Home = () => {
  const navigate = useNavigate();
  const { usuario, token } = useContext(AuthContext);

  const [user, setUser] = useState(null); // Armazena usuário autenticado
  const [properties, setProperties] = useState([]); // Lista de propriedades do usuário
  const [loading, setLoading] = useState(true); // Status de carregamento

  // Carrega dados do usuário: contexto ou localStorage
  useEffect(() => {
    if (usuario) {
      setUser(usuario);
    } else {
      const localUser = localStorage.getItem('usuario');
      if (!localUser) {
        navigate(paths.login); // Redireciona se não autenticado
      } else {
        setUser(JSON.parse(localUser));
      }
    }
  }, [usuario, navigate]);

  // Busca propriedades do usuário autenticado
  useEffect(() => {
    if (!user) return;

    const accessToken = token || localStorage.getItem('accessToken');
    if (!accessToken) return navigate(paths.login);

    axios
      .get('http://localhost:8001/api/v1/property', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page: 1, limit: 20 }
      })
      .then((res) => {
        const allProps = res.data?.data?.properties || [];

        // Filtra apenas propriedades vinculadas ao usuário
        const myProps = allProps.filter((p) =>
          p.usuarios.some((u) => String(u.id) === String(user.id))
        );

        setProperties(myProps);
      })
      .catch(() => {
        // Em caso de erro, não exibe mensagem de erro por enquanto
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, token, navigate]);

  return (
    <div className="flex">
      <Sidebar user={user} />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-center mb-0">
          {/* ALTERAÇÃO 2: Usar a variável importada 'logoQota' no 'src' da imagem. */}
          <img src={logoQota} alt="Logo QOTA" className="h-64" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Bem-vindo à sua Dashboard</h1>
        <p className="text-gray-700 mb-6 text-center">
          Gerencie suas propriedades de forma rápida e eficiente.
        </p>

        <div className="flex justify-center mb-8">
          <Link
            to={paths.registrarPropriedade}
            className="inline-block px-6 py-3 bg-black text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all duration-300 shadow-md"
          >
            + Cadastrar Nova Propriedade
          </Link>
        </div>

        {!loading && properties.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold mb-4">Suas Propriedades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition hover:shadow-xl"
                >
                  <img
                    src={
                      prop.fotos[0]?.documento
                        ? `http://localhost:8001${prop.fotos[0].documento}`
                        : '/placeholder.png'
                    }
                    alt={prop.nomePropriedade}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold flex items-center mb-1">
                      {iconMap[prop.tipo] ?? iconMap['Outros']}
                      {prop.nomePropriedade}
                    </h3>
                    <p className="text-gray-600 mb-4 flex items-center">
                      {iconMap[prop.tipo] ?? iconMap['Outros']}
                      <span>{prop.tipo}</span>
                    </p>
                    <button
                      onClick={() => navigate(`/property/${prop.id}`)}
                      className="w-full py-2 bg-yellow-300 text-black rounded-xl font-medium hover:bg-yellow-400 transition"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          !loading && (
            <p className="text-gray-500 mt-4 text-center">
              Você ainda não possui propriedades cadastradas.
            </p>
          )
        )}
      </main>
    </div>
  );
};

export default Home;