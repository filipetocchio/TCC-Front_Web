/**
 * @file RegisterProperty.jsx
 * @description Página de formulário para o cadastro de novas propriedades no sistema.
 * Este componente gerencia o estado do formulário, a seleção de múltiplos arquivos
 * com pré-visualização, busca de CEP e o processo de submissão de dados para a API.
 */

// Todos direitos autorais reservados pelo QOTA.


import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import { Building, DollarSign, MapPin, Tag, UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';

/**
 * URL base da API, obtida de variáveis de ambiente com fallback para desenvolvimento local.
 * @type {string}
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

/**
 * Estado inicial do formulário, utilizado para popular e resetar os campos.
 */
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

  /**
   * @function handleInputChange
   * @description Manipula as mudanças nos campos de input de texto e select.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * @function handleFileChange
   * @description Gerencia a seleção de arquivos para fotos e documentos, aplicando validações.
   */
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'documento') {
      setForm(prev => ({ ...prev, documento: files[0] }));
    } else if (name === 'fotos') {
      const newFiles = Array.from(files);
      if (form.fotos.length + newFiles.length > 15) {
        toast.error('Você pode enviar no máximo 15 fotos.');
        return;
      }
      setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...newFiles] }));
    }
  };

  /**
   * @function removeFile
   * @description Permite que o usuário remova um arquivo da seleção antes do upload.
   */
  const removeFile = (fileType, index) => {
    if (fileType === 'documento') {
      setForm(prev => ({ ...prev, documento: null }));
    } else if (fileType === 'foto') {
      setForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
    }
  };

  /**
   * @description Efeito para buscar o endereço automaticamente quando um CEP válido é digitado.
   */
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

  /**
   * @function handleSubmit
   * @description Orquestra o processo de submissão do formulário.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submissionPromise = async () => {
      const accessToken = token || localStorage.getItem('accessToken');
      if (!accessToken || !usuario?.id) {
        throw new Error('Autenticação inválida. Faça login novamente.');
      }
      
      const propertyData = {
        nomePropriedade: form.nomePropriedade,
        valorEstimado: Number(form.valorEstimado) || null,
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
            <p className="text-gray-500 mt-1">Preencha as informações abaixo para adicionar um novo bem à sua conta.</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-8">
            <FormSection title="Informações Básicas" icon={<Building size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField required label="Nome da Propriedade" name="nomePropriedade" value={form.nomePropriedade} onChange={handleInputChange} icon={<Tag size={16} />} />
                <SelectField required label="Tipo de Propriedade" name="tipo" value={form.tipo} onChange={handleInputChange} options={tiposPropriedade} />
                <InputField label="Valor Estimado" name="valorEstimado" type="number" value={form.valorEstimado} onChange={handleInputChange} icon={<DollarSign size={16} />} placeholder="Ex: 150000.00" />
              </div>
            </FormSection>

            <FormSection title="Endereço" icon={<MapPin size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField required label="CEP" name="enderecoCep" value={form.enderecoCep} onChange={handleInputChange} maxLength={9} />
                <InputField required label="Cidade" name="enderecoCidade" value={form.enderecoCidade} onChange={handleInputChange} className="md:col-span-2" />
                <InputField required label="Bairro" name="enderecoBairro" value={form.enderecoBairro} onChange={handleInputChange} />
                <InputField required label="Logradouro" name="enderecoLogradouro" value={form.enderecoLogradouro} onChange={handleInputChange} className="md:col-span-2" />
                <InputField required label="Número" name="enderecoNumero" value={form.enderecoNumero} onChange={handleInputChange} />
                <InputField label="Complemento" name="enderecoComplemento" value={form.enderecoComplemento} onChange={handleInputChange} className="md:col-span-2" />
                <InputField label="Ponto de Referência" name="enderecoPontoReferencia" value={form.enderecoPontoReferencia} onChange={handleInputChange} className="md:col-span-3" />
              </div>
            </FormSection>

            <FormSection title="Documentos e Fotos" icon={<UploadCloud size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comprovante de Endereço (PDF, JPG, PNG)</label>
                  {form.documento ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                      <FileText size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{form.documento.name}</span>
                      <button type="button" onClick={() => removeFile('documento')} className="ml-auto text-red-500 hover:text-red-700"><X size={16} /></button>
                    </div>
                  ) : (
                    <FileInput name="documento" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fotos da Propriedade (mín. 1, máx. 15)</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
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
                    <FileInput name="fotos" onChange={handleFileChange} accept="image/*" multiple />
                  )}
                </div>
              </div>
            </FormSection>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
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

export default RegisterProperty;

