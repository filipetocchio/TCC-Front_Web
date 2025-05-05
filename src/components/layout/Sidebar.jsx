import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Usando Link para navegação
import { Home, LogOut } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const Sidebar = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Redireciona para login
    window.location.href = '/login';
  };

  return (
    <aside className={clsx(
      'h-screen bg-gold text-black transition-all duration-300 flex flex-col justify-between',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div>
        <button onClick={() => setCollapsed(!collapsed)} className="p-4 focus:outline-none">
          ☰
        </button>

        <Link to="/editprofile" className="flex items-center p-4 hover:bg-secondary">

          <img
            src={user?.fotoPerfil || 'https://www.w3schools.com/w3images/avatar2.png'} // Foto maior padrão
            alt="Foto de perfil"
            className="w-16 h-16 rounded-full mr-2" // Tamanho maior e redondo
          />
          {!collapsed && <span>{user?.nomeCompleto}</span>}
        </Link>

        <hr className="border-black my-2" />

        {/* Link para a página Home */}
        <Link to="/home" className="flex items-center p-4 hover:bg-secondary">
          <Home className="mr-2" />
          {!collapsed && <span>Home</span>}
        </Link>
      </div>

      {/* Botão de Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center text-white bg-black hover:bg-red-600 p-4 w-full"
      >
        <LogOut className="mr-2" />
        {!collapsed && <span>Logout</span>}
      </button>

    </aside>
  );
};

Sidebar.propTypes = {
  user: PropTypes.shape({
    fotoPerfil: PropTypes.string,
    nomeCompleto: PropTypes.string
  })
};

export default Sidebar;
