/**
 * @file RegisterProperty.jsx
 * @description Página de formulário para o cadastro de novas propriedades no sistema,
 * com validação de documentos em tempo real utilizando IA (OCR) e formatação de campos.
 */
import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import { Building, DollarSign, MapPin, Tag, UploadCloud, FileText, Image as ImageIcon, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const initialFormState = {
  nomePropriedade: '',
  valorEstimado: '',
  tipo: '',
  enderecoCep: '',
  enderecoCidade: '',
  enderecoBairro: '',
  enderecoLogradouro: '',
  enderecoNumero: '',
  enderecoComplemento: '',
  enderecoPontoReferencia: '',
  documento: null,
  fotos: [],
};

const tiposPropriedade = ['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros'];

const RegisterProperty = () => {
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('idle'); // 'idle', 'validating', 'success', 'error'

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * @function handleDocumentChange
   * @description Acionado quando um arquivo de documento é selecionado. Inicia o processo
   * de validação em tempo real com a API de OCR.
   */
const handleDocumentChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setForm(prev => ({ ...prev, documento: file }));
  setDocumentStatus('validating');
  const loadingToast = toast.loading('Validando documento com IA...');

  // Monta o endereço completo para validação
  const fullAddress = `${form.enderecoLogradouro}, ${form.enderecoNumero}`;
  
  // Verifica se os campos essenciais estão preenchidos
  if (fullAddress.length < 5 || form.enderecoCep.length < 8) {
    toast.error('Por favor, preencha o CEP e o endereço completo antes de validar.', { id: loadingToast });
    setDocumentStatus('error');
    setForm(prev => ({ ...prev, documento: null })); // Limpa o arquivo se os dados estiverem incompletos
    return;
  }

  const formData = new FormData();
  formData.append('documento', file);
  formData.append('address', fullAddress);
  formData.append('cep', form.enderecoCep); 

  try {
    await axios.post(`${API_URL}/validation/address`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDocumentStatus('success');
    toast.success('Documento validado com sucesso!', { id: loadingToast });
  } catch (error) {
    setDocumentStatus('error');
    toast.error(error.response?.data?.message || 'Falha na validação do documento.', { id: loadingToast });
  }
};

  const handlePhotosChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (form.fotos.length + newFiles.length > 15) {
      toast.error('Você pode enviar no máximo 15 fotos.');
      return;
    }
    setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...newFiles] }));
  };

  const removeFile = (fileType, index) => {
    if (fileType === 'documento') {
      setForm(prev => ({ ...prev, documento: null }));
      setDocumentStatus('idle');
    } else if (fileType === 'foto') {
      setForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
    }
  };

  useEffect(() => {
    const cep = form.enderecoCep.replace(/\D/g, '');
    if (cep.length === 8) {
      const fetchCep = async () => {
        try {
          const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
          if (!data.erro) {
            setForm(prev => ({
              ...prev,
              enderecoLogradouro: data.logradouro,
              enderecoBairro: data.bairro,
              enderecoCidade: data.localidade,
            }));
            toast.success('Endereço preenchido automaticamente!');
          } else {
            toast.error('CEP não encontrado.');
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
          toast.error('Não foi possível buscar o CEP.');
        }
      };
      fetchCep();
    }
  }, [form.enderecoCep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (documentStatus !== 'success') {
      toast.error('Por favor, valide um comprovante de endereço antes de continuar.');
      return;
    }
    setLoading(true);

    const submissionPromise = async () => {
      const accessToken = token || localStorage.getItem('accessToken');
      if (!accessToken || !usuario?.id) {
        throw new Error('Autenticação inválida. Faça login novamente.');
      }
      
      const propertyData = {
        nomePropriedade: form.nomePropriedade,
        valorEstimado: parseFloat(form.valorEstimado.replace(/\./g, '').replace(',', '.')) || null,
        tipo: form.tipo,
        enderecoCep: form.enderecoCep.replace(/\D/g, ''),
        enderecoCidade: form.enderecoCidade,
        enderecoBairro: form.enderecoBairro,
        enderecoLogradouro: form.enderecoLogradouro,
        enderecoNumero: form.enderecoNumero,
        enderecoComplemento: form.enderecoComplemento,
        enderecoPontoReferencia: form.enderecoPontoReferencia,
        userId: usuario.id,
      };
      
      const propResponse = await axios.post(`${API_URL}/property/create`, propertyData, { headers: { Authorization: `Bearer ${accessToken}` } });
      const propertyId = propResponse.data.data.id;

      const uploadPromises = [];
      if (form.documento) {
        const docFormData = new FormData();
        docFormData.append('documento', form.documento);
        docFormData.append('idPropriedade', propertyId.toString());
        docFormData.append('tipoDocumento', 'Comprovante_Endereco');
        uploadPromises.push(axios.post(`${API_URL}/propertyDocuments/upload`, docFormData, { headers: { Authorization: `Bearer ${accessToken}` } }));
      }
      
      form.fotos.forEach(foto => {
        const fotoFormData = new FormData();
        fotoFormData.append('foto', foto);
        fotoFormData.append('idPropriedade', propertyId.toString());
        uploadPromises.push(axios.post(`${API_URL}/propertyPhoto/upload`, fotoFormData, { headers: { Authorization: `Bearer ${accessToken}` } }));
      });

      await Promise.all(uploadPromises);
    };

    toast.promise(submissionPromise(), {
      loading: 'Cadastrando propriedade...',
      success: () => {
        setLoading(false);
        setForm(initialFormState);
        navigate(paths.home);
        return 'Propriedade cadastrada com sucesso!';
      },
      error: (err) => {
        setLoading(false);
        return err.response?.data?.message || 'Erro ao cadastrar. Verifique os campos.';
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={usuario} />
      <main className="flex-1 p-4 sm:p-6 ml-0 sm:ml-64 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <header className="mb-6 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-800">Cadastrar Nova Propriedade</h1>
            <p className="text-gray-500 mt-1">Preencha as informações para adicionar um novo bem à sua conta.</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-8">
            <FormSection title="Informações Básicas" icon={<Building size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField required label="Nome da Propriedade" name="nomePropriedade" value={form.nomePropriedade} onChange={handleInputChange} icon={<Tag size={16} />} />
                <SelectField required label="Tipo de Propriedade" name="tipo" value={form.tipo} onChange={handleInputChange} options={tiposPropriedade} />
                <CurrencyInputField label="Valor Estimado" name="valorEstimado" value={form.valorEstimado} onChange={handleInputChange} icon={<DollarSign size={16} />} />
              </div>
            </FormSection>

            <FormSection title="Endereço e Validação" icon={<MapPin size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField required label="CEP" name="enderecoCep" value={form.enderecoCep} onChange={handleInputChange} maxLength={9} />
                <InputField required label="Cidade" name="enderecoCidade" value={form.enderecoCidade} onChange={handleInputChange} className="md:col-span-2" />
                <InputField required label="Bairro" name="enderecoBairro" value={form.enderecoBairro} onChange={handleInputChange} />
                <InputField required label="Logradouro" name="enderecoLogradouro" value={form.enderecoLogradouro} onChange={handleInputChange} className="md:col-span-2" />
                <InputField required label="Número" name="enderecoNumero" value={form.enderecoNumero} onChange={handleInputChange} />
                <InputField label="Complemento" name="enderecoComplemento" value={form.enderecoComplemento} onChange={handleInputChange} className="md:col-span-2" />
                <InputField label="Ponto de Referência" name="enderecoPontoReferencia" value={form.enderecoPontoReferencia} onChange={handleInputChange} className="md:col-span-3" />
              </div>
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comprovante de Endereço (APENAS PDF)</label>
                {form.documento ? (
                  <div className="flex items-center gap-3 p-2 border rounded-md bg-gray-50">
                    <FileText size={20} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate flex-grow">{form.documento.name}</span>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {documentStatus === 'validating' && <Loader2 size={20} className="animate-spin text-blue-500" />}
                      {documentStatus === 'success' && <CheckCircle size={20} className="text-green-500" />}
                      {documentStatus === 'error' && <XCircle size={20} className="text-red-500" />}
                      <button type="button" onClick={() => removeFile('documento')} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                    </div>
                  </div>
                ) : (
                  <FileInput name="documento" onChange={handleDocumentChange} accept=".pdf" />
                )}
              </div>
            </FormSection>

            <FormSection title="Fotos da Propriedade" icon={<ImageIcon size={20} />}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adicione até 15 fotos</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
                  {form.fotos.map((file, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md" />
                      <button type="button" onClick={() => removeFile('foto', index)} className="absolute top-1 right-1 bg-red-600/70 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                {form.fotos.length < 15 && (
                  <FileInput name="fotos" onChange={handlePhotosChange} accept="image/*" multiple />
                )}
              </div>
            </FormSection>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading || documentStatus !== 'success'}
                className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Propriedade'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

// --- Componentes Auxiliares ---
const FormSection = ({ title, icon, children }) => (
  <section>
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
      {icon}{title}
    </h3>
    <div className="space-y-4">{children}</div>
  </section>
);
FormSection.propTypes = { title: PropTypes.string.isRequired, icon: PropTypes.node, children: PropTypes.node.isRequired };

const InputField = ({ label, name, icon, className, ...props }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
      <input id={name} name={name} {...props} className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold ${icon ? 'pl-9' : 'pl-3'}`} />
    </div>
  </div>
);
InputField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, icon: PropTypes.node, className: PropTypes.string };

const SelectField = ({ label, name, options, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select id={name} name={name} {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold">
      <option value="">Selecione...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
SelectField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, options: PropTypes.arrayOf(PropTypes.string).isRequired };

const FileInput = (props) => (
  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gold transition-colors">
    <ImageIcon size={24} className="mx-auto text-gray-400" />
    <p className="mt-1 text-sm text-gray-600">Arraste e solte ou <span className="font-semibold text-gold">clique aqui</span></p>
    <input type="file" {...props} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
  </div>
);

/**
 * @component CurrencyInputField
 * @description InputField especializado para formatação de moeda BRL em tempo real.
 */
const CurrencyInputField = ({ label, name, value, onChange, icon }) => {
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
  
  return <InputField label={label} name={name} value={value} onChange={handleCurrencyChange} icon={icon} placeholder="0,00" />;
};
CurrencyInputField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired, icon: PropTypes.node };

export default RegisterProperty;