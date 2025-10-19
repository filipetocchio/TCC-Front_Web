// Todos direitos autorais reservados pelo QOTA.

/**
 * Biblioteca de Componentes de Formulário
 *
 * Descrição:
 * Este arquivo serve como uma biblioteca de UI centralizada para componentes de
 * formulário reutilizáveis em toda a aplicação Qota. A componentização de
 * elementos de formulário promove a consistência visual, a reutilização de código
 * (DRY) e a manutenibilidade do projeto.
 *
 */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { FileText, ImageIcon, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Componente para agrupar e titular seções de um formulário.
 */
export const FormSection = React.memo(({ title, icon, children }) => (
  <section>
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
      {icon}{title}
    </h3>
    <div className="space-y-4">{children}</div>
  </section>
));
FormSection.displayName = 'FormSection';
FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired
};

/**
 * Componente de input de texto genérico com suporte a ícone e label.
 */
export const InputField = React.memo(({ label, name, icon, className, ...props }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
      <input id={name} name={name} {...props} className={clsx(
        'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold',
        icon ? 'pl-9' : 'pl-3'
      )} />
    </div>
  </div>
));
InputField.displayName = 'InputField';
InputField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string
};

/**
 * Componente de select (dropdown) genérico.
 */
export const SelectField = React.memo(({ label, name, options, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select id={name} name={name} {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold">
      <option value="">Selecione...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
));
SelectField.displayName = 'SelectField';
SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired
};

/**
 * Componente de input de arquivo estilizado.
 */
export const FileInput = React.memo((props) => (
  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gold transition-colors">
    <ImageIcon size={24} className="mx-auto text-gray-400" />
    <p className="mt-1 text-sm text-gray-600">Arraste e solte ou <span className="font-semibold text-gold">clique aqui</span></p>
    <input type="file" {...props} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
  </div>
));
FileInput.displayName = 'FileInput';

export const FilePreview = React.memo(({ file, onRemove, status = 'idle', isImage = false, imageUrl }) => {
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        // Se for uma imagem existente, usa a URL fornecida.
        if (isImage && imageUrl) {
            setPreviewUrl(imageUrl);
        // Se for um novo arquivo de imagem, cria uma URL de objeto.
        } else if (isImage && file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file, isImage, imageUrl]);

    if (isImage) {
        return (
            <div className="relative group aspect-square">
                <img src={previewUrl} alt={`Preview de ${file.name}`} className="w-full h-full object-cover rounded-md" />
                <button type="button" onClick={onRemove} className="absolute top-1 right-1 bg-red-600/70 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-3 p-2 border rounded-md bg-gray-50">
            <FileText size={20} className="text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate flex-grow">{file.name}</span>
            <div className="flex-shrink-0 flex items-center gap-2">
                {status === 'validating' && <Loader2 size={20} className="animate-spin text-blue-500" />}
                {status === 'success' && <CheckCircle size={20} className="text-green-500" />}
                {status === 'error' && <XCircle size={20} className="text-red-500" />}
                <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700"><X size={18} /></button>
            </div>
        </div>
    );
});
FilePreview.displayName = 'FilePreview';
FilePreview.propTypes = {
    file: PropTypes.object,
    onRemove: PropTypes.func.isRequired,
    status: PropTypes.oneOf(['idle', 'validating', 'success', 'error']),
    isImage: PropTypes.bool,
    imageUrl: PropTypes.string,
};



/**
 * Componente de input especializado para formatação de moeda BRL em tempo real.
 */
export const CurrencyInputField = React.memo(({ label, name, value, onChange, icon }) => {
  const handleCurrencyChange = useCallback((e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      onChange({ target: { name, value: '' } });
      return;
    }
    const numberValue = parseFloat(rawValue) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'decimal', // Usar 'decimal' para edição, 'currency' mostraria R$
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
    onChange({ target: { name, value: formattedValue } });
  }, [onChange, name]);
  
  return <InputField label={label} name={name} value={value} onChange={handleCurrencyChange} icon={icon} placeholder="0,00" inputMode="decimal" />;
});
CurrencyInputField.displayName = 'CurrencyInputField';
CurrencyInputField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.node
};