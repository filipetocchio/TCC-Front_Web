// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Home, LogOut, DollarSign, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import paths from '../../routes/paths';

// Componente da Sidebar com suporte a colapso e carregamento de dados do usuário
const Sidebar = ({ variant = 'default' }) => {
  const [user, setUser] = useState(null); // Estado para armazenar os dados do usuário logado
  const [collapsed, setCollapsed] = useState(false); // Estado para controlar o colapso da sidebar
  const [errorMessage, setErrorMessage] = useState(null); // Mensagem de erro em caso de falha na API
  const navigate = useNavigate();
  const { id: propertyId } = useParams(); // Captura o ID da URL para os links contextuais

  // Recupera o ID do usuário salvo no localStorage após o login
  const userId = JSON.parse(localStorage.getItem('usuario'))?.id;

  // Efeito que busca os dados do usuário ao carregar o componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userId) {
          const response = await axios.get(`http://localhost:8001/api/v1/user/${userId}`);
          setUser(response.data.data); // Armazena os dados retornados
        }
      } catch {
        setErrorMessage('Erro ao carregar informações do usuário.');
      }
    };

    fetchUserData();
  }, [userId]);

  // Função de logout: limpa dados de autenticação e redireciona
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  /**
   * Renderiza os links de navegação com base na variante da sidebar.
   * A variante 'property' exibe links de gerenciamento específicos.
   */
  const renderNavLinks = () => (
    <>
      {/* Link de navegação: Home (padrão) */}
      <Link to="/home" className="flex items-center p-4 hover:bg-secondary">
        <Home className="mr-2" />
        {!collapsed && <span>Página Inicial</span>}
      </Link>

      {/* Renderiza links contextuais para a gestão de uma propriedade específica */}
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
        {/* Botão de colapso */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 focus:outline-none"
          title="Expandir/Recolher menu"
        >
          ☰
        </button>

        {/* Perfil do usuário */}
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

        {/* Exibe erro, se houver */}
        {errorMessage && !collapsed && (
          <div className="text-red-700 bg-red-100 border border-red-400 mx-4 mt-4 p-2 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Botão de logout */}
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