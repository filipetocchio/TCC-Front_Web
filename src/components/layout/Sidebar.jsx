// Todos direitos autorais reservados pelo QOTA.

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Home, LogOut, DollarSign, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';
import paths from '../../routes/paths';
import useAuth from '../../hooks/useAuth';

/**
 * @component Sidebar
 * @description Componente de menu lateral da aplicação. Consome os dados do usuário
 * do contexto de autenticação e exibe links de navegação relevantes.
 */
const Sidebar = ({ variant = 'default' }) => {
  // Obtém o usuário e a função de logout do contexto de autenticação.
  const { usuario: user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { id: propertyId } = useParams();

  /**
   * Executa o logout do usuário, limpando os dados da sessão e redirecionando
   * para a página de login.
   */
  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  /**
   * Renderiza os links de navegação principais e contextuais da sidebar.
   */
  const renderNavLinks = () => (
    <>
      <Link to="/home" className="flex items-center p-4 hover:bg-secondary">
        <Home className="mr-2" />
        {!collapsed && <span>Página Inicial</span>}
      </Link>

      {/* Renderiza links de gerenciamento apenas se estiver na página de uma propriedade. */}
      {variant === 'property' && propertyId && (
        <>
          <hr className="border-black my-2" />
          <Link to={paths.financeiro.replace(':id', propertyId)} className="flex items-center p-4 hover:bg-secondary">
            <DollarSign className="mr-2" />
            {!collapsed && <span>Financeiro</span>}
          </Link>
          <Link to={paths.calendario.replace(':id', propertyId)} className="flex items-center p-4 hover:bg-secondary">
            <Calendar className="mr-2" />
            {!collapsed && <span>Agenda</span>}
          </Link>
          <Link to={paths.gerenciarMembros.replace(':id', propertyId)} className="flex items-center p-4 hover:bg-secondary">
            <Users className="mr-2" />
            {!collapsed && <span>Cotistas</span>}
          </Link>
        </>
      )}
    </>
  );

  return (
    <aside
      className={clsx(
        'h-screen bg-gold-gradient-vertical text-white transition-all duration-300 flex flex-col justify-between fixed top-0 left-0 bottom-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 focus:outline-none"
          title="Expandir/Recolher menu"
        >
          ☰
        </button>

        <Link
          to="/editprofile"
          className={clsx(
            'flex items-center p-4 hover:bg-secondary transition-all duration-300',
            collapsed && 'justify-center'
          )}
        >
          <img
            src={user?.userPhoto?.url || 'https://www.w3schools.com/w3images/avatar2.png'}
            alt="Foto de perfil do usuário"
            className={clsx(
              'rounded-full object-cover transition-all duration-300 ease-in-out',
              collapsed ? 'w-12 h-12' : 'w-16 h-16 mr-2'
            )}
          />
          {!collapsed && <span className="font-medium">{user?.nomeCompleto || 'Usuário'}</span>}
        </Link>

        <hr className="border-black my-2" />
        
        <nav>
            {renderNavLinks()}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center text-white bg-black hover:bg-red-600 p-4 w-full transition duration-200"
      >
        <LogOut className="mr-2" />
        {!collapsed && <span>Sair</span>}
      </button>
    </aside>
  );
};

Sidebar.propTypes = {
  variant: PropTypes.oneOf(['default', 'property']),
};

export default Sidebar;