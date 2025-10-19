// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente Sidebar
 *
 * Descrição:
 * Este arquivo define a barra de navegação lateral da aplicação. O componente é
 * "controlado", recebendo seu estado (expandido/recolhido) e a função para
 * alterá-lo de seu componente pai. Isso garante que o layout da página possa se
 * ajustar dinamicamente à largura do sidebar.
 *
 * Funcionalidades:
 * - Exibe o avatar e o nome do usuário.
 * - É expansível e recolhível para otimizar o espaço da tela.
 * - Renderiza links de navegação contextuais, mostrando opções de gerenciamento
 * apenas quando o usuário está na página de detalhes de uma propriedade.
 * - Utiliza `NavLink` para destacar visualmente a rota ativa.
 * - Fornece feedback de carregamento durante o processo de logout.
 */
import React, { useState, useCallback } from 'react';
import { NavLink, Link, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Home, LogOut, DollarSign, Calendar, Users, Menu, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import paths from '../../routes/paths';
import useAuth from '../../hooks/useAuth';
import SuaLogo from '../../assets/Ln QOTA.png';

// Define a URL base da API para construir os caminhos das imagens.
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

const Sidebar = ({ variant = 'default', collapsed, onToggle }) => {
  // --- Gerenciamento de Estado ---
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- Hooks ---
  const { usuario: user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: propertyId } = useParams();

  /**
   * Executa o logout do usuário de forma assíncrona.
   */
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Falha no processo de logout:", error);
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  // --- Dados de Navegação ---
  const defaultLinks = [
    { to: paths.home, icon: Home, label: 'Página Inicial' },
  ];

  const propertyLinks = propertyId ? [
    { to: paths.financeiro.replace(':id', propertyId), icon: DollarSign, label: 'Financeiro' },
    { to: paths.calendario.replace(':id', propertyId), icon: Calendar, label: 'Agenda' },
    { to: paths.gerenciarMembros.replace(':id', propertyId), icon: Users, label: 'Cotistas' },
  ] : [];
  
  const iconClass = "mr-4 flex-shrink-0";

  // --- Renderização ---
  return (
    <aside
      className={clsx(
        'h-screen bg-gold-gradient-vertical text-white transition-all duration-300 flex flex-col justify-between fixed top-0 left-0 bottom-0 z-50',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div>
        {/* Cabeçalho com logo e botão de colapso */}
        <div className="flex items-center justify-between p-4 h-20">
          {!collapsed && (
            <Link to={paths.home}>
              <img src={SuaLogo} alt="Logo QOTA" className="h-12" />
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-white/20 focus:outline-none"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <Menu /> : <X />}
          </button>
        </div>
        
        {/* Navegação Principal*/}
        <nav className="flex flex-col">
        {/* Perfil do Usuário */}
          <Link
            to={paths.editarPerfil}
            className={clsx(
              'flex items-center p-4 hover:bg-white/20 transition-all duration-300',
              collapsed && 'justify-center'
            )}
          >
            <img
              src={user?.userPhoto?.url || 'https://www.w3schools.com/w3images/avatar2.png'}
              alt="Foto de perfil do usuário"
              className={clsx(
                'rounded-full object-cover transition-all duration-300 ease-in-out border-2 border-white/50',
                
                collapsed ? 'w-10 h-10' : 'w-16 h-16 mr-3'
              )}
            />
            
            {!collapsed && <span className="font-medium break-words">{user?.nomeCompleto || 'Usuário'}</span>}
          </Link>
          
          <hr className="border-black/30 my-2" />

          {/* Outros links de navegação */}
          {defaultLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "flex items-center p-4 transition-colors duration-200",
                isActive ? "bg-black/40 font-semibold" : "hover:bg-black/20",
                collapsed && "justify-center"
              )}
              title={label}
            >
              <Icon className={iconClass} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}

          {/* Navegação Contextual da Propriedade */}
          {variant === 'property' && propertyId && (
            <>
              <hr className="border-black/30 my-2" />
              {propertyLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => clsx(
                    "flex items-center p-4 transition-colors duration-200",
                    isActive ? "bg-black/40 font-semibold" : "hover:bg-black/20",
                    collapsed && "justify-center"
                  )}
                  title={label}
                >
                  <Icon className={iconClass} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>

      {/* Rodapé com Botão de Sair */}
      <button
        onClick={handleLogout}
        className={clsx(
            "flex items-center text-white bg-black/50 hover:bg-red-700 p-4 w-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
            collapsed && "justify-center"
        )}
        disabled={isLoggingOut}
        title="Sair"
      >
        {isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOut className={!collapsed ? iconClass : ''} />}
        {!collapsed && <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>}
      </button>
    </aside>
  );
};

Sidebar.propTypes = {
  variant: PropTypes.oneOf(['default', 'property']),
  collapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default Sidebar;