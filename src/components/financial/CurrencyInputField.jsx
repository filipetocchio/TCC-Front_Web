// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente de Input de Moeda
 *
 * Descrição:
 * Este arquivo define um componente de input especializado para a entrada e formatação
 * de valores monetários no padrão BRL (Real Brasileiro). Ele mascara a entrada do
 * usuário em tempo real para exibir um formato de moeda familiar (ex: "1.234,56"),
 * enquanto gerencia um valor numérico por baixo.
 *
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

const CurrencyInputField = React.memo(({ label, name, value, onChange, required, ...rest }) => {
  /**
   * Manipula a mudança no campo de input, formatando o valor para o padrão de moeda.
   */
  const handleCurrencyChange = useCallback((e) => {
    // Remove todos os caracteres não numéricos para obter o valor bruto.
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      onChange({ target: { name, value: '' } });
      return;
    }

    // Formata o número para o padrão brasileiro (ex: 123456 -> "1.234,56").
    const numberValue = parseFloat(rawValue) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
    
    onChange({ target: { name, value: formattedValue } });
  }, [onChange, name]);
  
  // Garante que o valor exibido seja sempre uma string formatada ou vazia.
  const displayValue = typeof value === 'number' 
    ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)
    : value || '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <input 
        type="text" 
        name={name} 
        value={displayValue} 
        onChange={handleCurrencyChange} 
        placeholder="R$ 0,00"
        required={required}
        inputMode="decimal" // Melhora a experiência em dispositivos móveis
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        {...rest}
      />
    </div>
  );
});

// Adiciona um nome de exibição para facilitar a depuração no React DevTools.
CurrencyInputField.displayName = 'CurrencyInputField';

CurrencyInputField.propTypes = {
  /** O texto descritivo para o campo de input. */
  label: PropTypes.string.isRequired,
  /** Nome do campo, usado para identificar o valor no estado do formulário. */
  name: PropTypes.string.isRequired,
  /** O valor atual do campo (pode ser string ou número). */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** A função de callback para ser chamada quando o valor do campo muda. */
  onChange: PropTypes.func.isRequired,
  /** Se 'true', adiciona um asterisco ao label e a propriedade 'required' ao input. */
  required: PropTypes.bool,
};

export default CurrencyInputField;