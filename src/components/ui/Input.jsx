// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente de Input de Formulário
 *
 * Descrição:
 * Este arquivo define um componente de input genérico e reutilizável, projetado para
 * padronizar a aparência e o comportamento dos campos de formulário em toda a aplicação.
 *
 * Funcionalidades:
 * - Encapsula a lógica de label, ícone e estilização.
 * - Garante a acessibilidade associando a label ao input via `htmlFor`.
 * - Fornece feedback visual de foco no container do input (`focus-within`).
 * - Suporta um estado desabilitado (`disabled`).
 * - Otimizado com `React.memo` para prevenir re-renderizações desnecessárias.
 */
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const Input = React.memo(({ label, id, name, Icon, type = 'text', disabled = false, ...rest }) => {
  return (
    <div>
      {/* A label é associada ao input para melhor acessibilidade. */}
      <label htmlFor={id} className="block text-gray-700 font-semibold mb-1">
        {label}
      </label>
      
      {/* O container principal que gerencia os estilos de borda e foco. */}
      <div
        className={clsx(
          'flex items-center border border-gray-300 rounded-md px-3 py-2 gap-2 transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-gold focus-within:border-gold',
          {
            'bg-gray-100 cursor-not-allowed': disabled,
            'bg-white': !disabled,
          }
        )}
      >
        {/* Renderiza o ícone apenas se ele for fornecido como propriedade. */}
        {Icon && <Icon className="text-gray-500 flex-shrink-0" size={20} />}
        
        <input
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          {...rest} // Espalha as props restantes (value, onChange, placeholder, etc.)
          className={clsx(
            'w-full text-gray-800 placeholder-gray-500 focus:outline-none',
            {
              'bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
              'bg-white': !disabled,
            }
          )}
        />
      </div>
    </div>
  );
});

// Adiciona um nome de exibição para facilitar a depuração no React DevTools.
Input.displayName = 'Input';

// Definição das propriedades esperadas pelo componente.
Input.propTypes = {
  /** O texto descritivo para o campo de input. */
  label: PropTypes.string.isRequired,
  /** Identificador único para o input, essencial para a acessibilidade. */
  id: PropTypes.string.isRequired,
  /** Nome do campo, usado para identificar o valor no estado do formulário. */
  name: PropTypes.string.isRequired,
  /** Componente de ícone (opcional) a ser exibido à esquerda. */
  Icon: PropTypes.elementType,
  /** O tipo do input HTML (ex: 'text', 'password', 'email', 'number'). */
  type: PropTypes.string,
  /** Se 'true', o campo será visualmente e funcionalmente desabilitado. */
  disabled: PropTypes.bool,
};

export default Input;