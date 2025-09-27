// Todos direitos autorais reservados pelo QOTA.

import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';

import Sidebar from '../components/layout/Sidebar';
import paths from '../routes/paths';
import { Home as HomeIcon, Building2, MapPin, Archive, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import logoQota from '../assets/Ln QOTA.png';


const API_BASE_URL = 'http://localhost:8001/api/v1';

/**
 * Mapeia os tipos de propriedade para seus respectivos ícones,
 * melhorando a identificação visual na interface.
 */
const propertyIconMap = {
  Casa: <HomeIcon className="inline-block mr-2" size={16} />,
  Apartamento: <Building2 className="inline-block mr-2" size={16} />,
  Chácara: <MapPin className="inline-block mr-2" size={16} />,
  Lote: <Archive className="inline-block mr-2" size={16} />,
  Outros: <HomeIcon className="inline-block mr-2" size={16} />
};

/**
 * Componente que renderiza um card individual para cada propriedade.
 * @param {{ property: object, navigate: function }} props
 */
const PropertyCard = ({ property, navigate }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-xl">
    <img
      src={property.fotos[0]?.documento ? `http://localhost:8001${property.fotos[0].documento}` : '/placeholder.png'}
      alt={`Imagem da propriedade ${property.nomePropriedade}`}
      className="w-full h-48 object-cover"
    />
    <div className="p-4 flex flex-col h-48">
      <div className="flex-grow">
        <span className="text-gray-600 text-sm flex items-center mb-1">
          {propertyIconMap[property.tipo] || propertyIconMap['Outros']}
          {property.tipo}
        </span>
        <h3 className="text-lg font-bold truncate">
          {property.nomePropriedade}
        </h3>
      </div>
      <button
        onClick={() => navigate(`/property/${property.id}`)}
        className="w-full mt-2 py-2 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-500 transition-colors duration-300"
      >
        Gerenciar
      </button>
    </div>
  </div>
);

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.any.isRequired,
    nomePropriedade: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    fotos: PropTypes.arrayOf(PropTypes.shape({
      documento: PropTypes.string
    }))
  }).isRequired,
  navigate: PropTypes.func.isRequired
};

/**
 * Página principal (Dashboard) da aplicação.
 * Responsável por saudar o usuário, buscar e exibir a lista de suas propriedades.
 */
const Home = () => {
  const navigate = useNavigate();
  const { usuario, token } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Efeito para garantir a autenticação do usuário.
   * Busca dados do contexto ou do localStorage e redireciona para o login se não encontrar.
   */
  useEffect(() => {
    if (usuario) {
      setUser(usuario);
    } else {
      try {
        const localUser = localStorage.getItem('usuario');
        if (!localUser) {
          navigate(paths.login);
        } else {
          setUser(JSON.parse(localUser));
        }
      } catch (err) {
        navigate(paths.login);
      }
    }
  }, [usuario, navigate]);

  /**
   * Efeito para buscar as propriedades do usuário autenticado na API.
   * Lida com estados de carregamento e erro.
   */
  useEffect(() => {
    if (!user) return;

    const accessToken = token || localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate(paths.login);
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(`${API_BASE_URL}/property`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page: 1, limit: 20 }
    })
    .then((res) => {
      const allProps = res.data?.data?.properties || [];
      // Filtra as propriedades para exibir apenas aquelas em que o usuário atual é um cotista.
      const userProps = allProps.filter((p) =>
        p.usuarios.some((u) => String(u.id) === String(user.id))
      );
      setProperties(userProps);
    })
    .catch(() => {
      setError('Não foi possível carregar suas propriedades. Por favor, tente novamente mais tarde.');
    })
    .finally(() => {
      setLoading(false);
    });
  }, [user, token, navigate]);

  /**
   * Renderiza o conteúdo da seção de propriedades com base nos estados de
   * carregamento, erro e dados disponíveis.
   */
  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-600 mt-8 text-center">Carregando propriedades...</p>;
    }

    if (error) {
      return (
        <div className="mt-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold flex items-center justify-center">
            <AlertTriangle className="mr-2" /> Ocorreu um erro
          </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }

    if (properties.length === 0) {
      return (
        <p className="text-gray-500 mt-8 text-center">
          Você ainda não possui propriedades cadastradas. Que tal começar agora?
        </p>
      );
    }

    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Suas Propriedades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} navigate={navigate} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-center mb-0">
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

        {renderContent()}
      </main>
    </div>
  );
};

export default Home;
