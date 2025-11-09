// Todos direitos autorais reservados pelo QOTA.

/**
 * Página Home (Dashboard do Usuário)
 *
 * Descrição:
 * Este arquivo define a página principal da aplicação, que serve como o dashboard
 * para o usuário autenticado. Ele utiliza o hook customizado `useUserProperties` para
 * buscar, exibir e paginar a lista de propriedades associadas ao usuário.
 *
 * Funcionalidades:
 * - Exibe uma saudação personalizada para o usuário logado.
 * - Apresenta as propriedades do usuário em um layout de cartões.
 * - Cada cartão de propriedade exibe informações cruciais do fluxo de negócio,
 * como o número de frações e o saldo de diárias para agendamento.
 * - Gerencia estados de carregamento, erro e de lista vazia.
 * - Inclui controles de paginação para navegar por grandes listas de propriedades.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useUserProperties } from '../hooks/useUserProperties';
import useAuth from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import paths from '../routes/paths';
import logoQota from '../assets/Ln QOTA.png';
import { Home as HomeIcon, Building2, MapPin, Archive, AlertTriangle, PieChart, CalendarDays, ShieldCheck, Shield } from 'lucide-react';

// Define a URL base da API para construir os caminhos das imagens.
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

// --- Componentes de UI Internos ---

/**
 * Mapeamento de ícones para cada tipo de propriedade.
 */
const propertyIconMap = {
  Casa: <HomeIcon className="inline-block mr-2" size={16} />,
  Apartamento: <Building2 className="inline-block mr-2" size={16} />,
  Chacara: <MapPin className="inline-block mr-2" size={16} />,
  Lote: <Archive className="inline-block mr-2" size={16} />,
  Outros: <HomeIcon className="inline-block mr-2" size={16} />
};

/**
 * Exibe um badge com a permissão do usuário (Master ou Comum).
 */

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

/**
 * Exibe um cartão individual para cada propriedade na lista.
 * O componente é memorizado com React.memo para otimizar a performance,
 * evitando re-renderizações desnecessárias.
 */
const PropertyCard = React.memo(({ property }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-xl flex flex-col">
    <img
      src={property.imagemPrincipal ? `${API_BASE_URL}${property.imagemPrincipal}` : '/placeholder.png'}
      alt={`Imagem da propriedade ${property.nomePropriedade}`}
      className="w-full h-full object-cover"
    />
    <div className="p-4 flex flex-col flex-grow">
      <span className="text-gray-600 text-sm flex items-center mb-1">
        {propertyIconMap[property.tipo] || propertyIconMap['Outros']}
        {property.tipo}
      </span>
      <h3 className="text-lg font-bold truncate" title={property.nomePropriedade}>
        {property.nomePropriedade}
      </h3>

      {/* Badge de permissão do usuário para esta propriedade. */}
      <div className="mt-2 ">
        {property.permissao && <PermissionBadge permission={property.permissao} />}
      </div>

      {/* Informações do  fluxo de frações e saldo */}
      <div className="text-xs text-gray-500 mt-2 space-y-1">

        <div className="flex items-center pt-1 py-1">
          <CalendarDays size={14} className="mr-1  text-green-500" />
          <span>Saldo {new Date().getFullYear()}: <strong>{Math.floor(property.saldoDiariasAtual)} dias</strong></span>
        </div>
        <div className="flex items-center pt-1 py-1">
          <CalendarDays size={14} className="mr-1  text-blue-500" />
          <span>Saldo {new Date().getFullYear() + 1}: <strong>{Math.floor(property.saldoDiariasFuturo)} dias</strong></span>
        </div>
      </div>

      <Link
        to={paths.propriedade.replace(':id', property.id)}
        className="w-full mt-auto pt-2 py-2 text-center bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-500 transition-colors duration-300 block"
      >
        Gerenciar
      </Link>
    </div>
  </div>
));

PropertyCard.propTypes = { property: PropTypes.object.isRequired };

/**
 * Componente para os controles de paginação.
 */
const PaginationControls = React.memo(({ pagination, onPageChange }) => {
  if (pagination.totalPages <= 1) return null;

  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={page === pagination.currentPage}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${page === pagination.currentPage
              ? 'bg-gold text-white cursor-default'
              : 'bg-white text-black hover:bg-gray-200'
            }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
});
PaginationControls.propTypes = {
  pagination: PropTypes.object.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

const LoadingSpinner = () => (
  <div className="flex justify-center mt-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="mt-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
    <strong className="font-bold flex items-center justify-center"><AlertTriangle className="mr-2" /> Ocorreu um erro</strong>
    <span className="block sm:inline">{message}</span>
  </div>
);
ErrorMessage.propTypes = { message: PropTypes.string.isRequired };

const EmptyState = () => (
  <p className="text-gray-500 mt-8 text-center">
    Você ainda não possui propriedades cadastradas. Que tal começar agora?
  </p>
);

// --- Componente Principal da Página ---

const Home = () => {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { properties, loading, error, pagination, goToPage } = useUserProperties();
  const { usuario: currentUser } = useAuth();
  /**
   * Renderiza o conteúdo principal da página com base nos estados da busca.
   */
  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (properties.length === 0) return <EmptyState />;

    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Suas Propriedades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
        <PaginationControls pagination={pagination} onPageChange={goToPage} />
      </section>
    );
  };

  return (

    // Sidebar é fixo e o main tem uma margem para não ficar por baixo.
    <>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* A margem do conteúdo principal funciona corretamente em todas as telas. */}
      <main className={clsx(
        "p-6 transition-all duration-300",
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      )}>
        <div className="flex justify-center mb-4">
          <img src={logoQota} alt="Logo QOTA" className="h-20 sm:h-24" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Bem-vindo(a) à sua Dashboard!</h1>
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
    </>
  );
};

export default Home;