// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx'; // Biblioteca para construir classNames condicionalmente

/**
 * @file Input.jsx
 * @description Componente de input de formulário genérico e reutilizável.
 * Encapsula a lógica de label, ícone e estilização para ser usado em toda a aplicação.
 */

/**
 * Renderiza um campo de input padronizado com suporte para ícone, label,
 * e vários estados (como desabilitado).
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.label - O texto a ser exibido na tag <label>.
 * @param {string} props.id - O ID do input, usado para o 'htmlFor' da label (acessibilidade).
 * @param {string} props.name - O nome do input, usado para o gerenciamento do formulário.
 * @param {React.ElementType} [props.Icon] - O componente do ícone (ex: de lucide-react) a ser exibido.
 * @param {string} [props.type='text'] - O tipo do input (ex: 'text', 'email', 'password').
 * @param {boolean} [props.disabled=false] - Controla se o campo está desabilitado.
 * @param {object} props.rest - Quaisquer outras props padrão de um input HTML (value, onChange, required, etc.).
 * @returns {React.ReactElement} O componente de input renderizado.
 */
const Input = ({ label, id, name, Icon, type = 'text', disabled = false, ...rest }) => {
  return (
    <div>
      {/* A label é associada ao input através do 'htmlFor' para melhor acessibilidade */}
      <label htmlFor={id} className="block text-gray-700 font-semibold mb-1">
        {label}
      </label>
      
      {/* O container principal que recebe o foco e muda de estilo */}
      <div
        className={clsx(
          'flex items-center border border-gray-300 rounded-md px-3 py-2 gap-2 transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-gold focus-within:border-gold', // Efeito de foco
          {
            'bg-gray-100 cursor-not-allowed': disabled, // Estilo para o estado desabilitado
            'bg-white': !disabled, // Estilo padrão
          }
        )}
      >
        {/* Renderiza o ícone apenas se ele for fornecido como propriedade */}
        {Icon && <Icon className="text-gray-500" size={20} />}
        
        <input
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          {...rest} // Espalha as props restantes (value, onChange, placeholder, etc.)
          className={clsx(
            'w-full text-gray-800 placeholder-gray-500 focus:outline-none',
            // O input em si não precisa de 'outline', pois o container já cuida do feedback de foco.
            {
              'bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
              'bg-white': !disabled,
            }
          )}
        />
      </div>
    </div>
  );
};

// Definição e documentação das propriedades esperadas pelo componente.
// Isso ajuda a prevenir bugs e torna o componente mais fácil de usar por outros desenvolvedores.
Input.propTypes = {
  /**
   * O texto descritivo para o campo de input.
   */
  label: PropTypes.string.isRequired,
  /**
   * Identificador único para o input, essencial para a acessibilidade.
   */
  id: PropTypes.string.isRequired,
  /**
   * Nome do campo, usado para identificar o valor no estado do formulário.
   */
  name: PropTypes.string.isRequired,
  /**
   * Componente de ícone (opcional) a ser exibido à esquerda do texto.
   */
  Icon: PropTypes.elementType,
  /**
   * O tipo do input HTML (ex: 'text', 'password', 'email', 'number').
   */
  type: PropTypes.string,
  /**
   * Se 'true', o campo será visualmente e funcionalmente desabilitado.
   */
  disabled: PropTypes.bool,
};

export default Input;