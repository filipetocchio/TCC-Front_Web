// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de input especializado para formatação de moeda BRL (Real Brasileiro).
 */
const CurrencyInputField = ({ label, name, value, onChange }) => {
  const handleCurrencyChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      onChange({ target: { name, value: '' } });
      return;
    }
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(rawValue) / 100);
    onChange({ target: { name, value: formattedValue } });
  };
  
  const displayValue = typeof value === 'number' 
    ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)
    : value;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label} *</label>
      <input 
        type="text" 
        name={name} 
        value={displayValue || ''} 
        onChange={handleCurrencyChange} 
        placeholder="R$ 0,00"
        required
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  );
};

CurrencyInputField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

export default CurrencyInputField;