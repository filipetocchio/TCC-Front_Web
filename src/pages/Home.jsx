// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useUserProperties } from '../hooks/useUserProperties';
import useAuth from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import paths from '../routes/paths';
import logoQota from '../assets/Ln QOTA.png';
import { Home as HomeIcon, Building2, MapPin, Archive, AlertTriangle, ShieldCheck, Shield } from 'lucide-react';

/**
 * @page Home
 * @description Página principal (Dashboard) da aplicação. Utiliza o hook 'useUserProperties'
 * para buscar e exibir a lista de propriedades do usuário autenticado.
 */

// Componentes de UI (permanecem os mesmos, mas podem ser movidos para seus próprios arquivos no futuro)
const propertyIconMap = {
  Casa: <HomeIcon className="inline-block mr-2" size={16} />,
  Apartamento: <Building2 className="inline-block mr-2" size={16} />,
  Chacara: <MapPin className="inline-block mr-2" size={16} />,
  Lote: <Archive className="inline-block mr-2" size={16} />,
  Outros: <HomeIcon className="inline-block mr-2" size={16} />
};

const PermissionBadge = ({ permission }) => {
  const isMaster = permission === 'proprietario_master';
  const Icon = isMaster ? ShieldCheck : Shield;
  const text = isMaster ? 'Master' : 'Comum';
  const color = isMaster ? 'text-gold' : 'text-gray-600';

  return (
    <div className={`flex items-center text-xs font-semibold ${color}`}>
      <Icon size={14} className="mr-1" />
      <span>{text}</span>
    </div>
  );
};
PermissionBadge.propTypes = { permission: PropTypes.string };

const PropertyCard = ({ property, navigate }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-xl">
    <img
      src={property.imagemPrincipal || '/placeholder.png'}
      alt={`Imagem da propriedade ${property.nomePropriedade}`}
      className="w-full h-40 object-cover"
    />
    <div className="p-4 flex flex-col justify-between" style={{ height: '10rem' }}>
      <div>
        <span className="text-gray-600 text-sm flex items-center mb-1">
          {propertyIconMap[property.tipo] || propertyIconMap['Outros']}
          {property.tipo}
        </span>
        <h3 className="text-lg font-bold truncate" title={property.nomePropriedade}>
          {property.nomePropriedade}
        </h3>
        {property.permissao && <PermissionBadge permission={property.permissao} />}
      </div>
      <button
        onClick={() => navigate(paths.propriedade.replace(':id', property.id))}
        className="w-full mt-2 py-2 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-500 transition-colors duration-300"
      >
        Gerenciar
      </button>
    </div>
  </div>
);
PropertyCard.propTypes = {
  property: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
};

const Home = () => {
  // O componente agora consome o hook, que encapsula toda a lógica de busca.
  const { properties, loading, error } = useUserProperties();
  const { usuario: currentUser } = useAuth();
  const navigate = useNavigate();

  /**
   * Renderiza o conteúdo principal da página com base nos estados de
   * carregamento, erro ou sucesso, providos pelo hook 'useUserProperties'.
   */
  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center mt-8"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold"></div></div>;
    }
    if (error) {
      return (
        <div className="mt-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold flex items-center justify-center"><AlertTriangle className="mr-2" /> Ocorreu um erro</strong>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((prop) => (
            <PropertyCard 
              key={prop.id} 
              property={prop}
              navigate={navigate} 
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 ml-0 md:ml-64">
        <div className="flex justify-center mb-4">
          <img src={logoQota} alt="Logo QOTA" className="h-20 sm:h-24" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Bem-vindo(a) à sua Dashboard</h1>
          <p className="text-gray-600 mt-1">Gerencie suas propriedades de forma rápida e eficiente.</p>
        </div>
        <div className="flex justify-center mb-8">
          <Link
            to={paths.registrarPropriedade}
            className="inline-block px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-300 shadow-md"
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