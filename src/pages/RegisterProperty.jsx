// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Cadastro de Propriedade
 *
 * Descrição:
 * Este arquivo define a página de formulário para o cadastro de novas propriedades.
 * O componente gerencia um formulário multi-etapas, lida com a validação de
 * comprovante de endereço via OCR em tempo real e orquestra o envio dos dados
 * e arquivos para a API.
 *
 * Funcionalidades:
 * - Formulário para dados básicos, de endereço e de frações da propriedade.
 * - Integração com a API ViaCEP para preenchimento automático de endereço.
 * - Validação de comprovante de endereço (PDF) com o serviço de OCR.
 * - Upload de múltiplas fotos para a propriedade.
 * - Feedback visual para o usuário durante as validações e submissão.
 * - Modal de ajuda para explicar conceitos-chave ao usuário.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import paths from '../routes/paths';
import Sidebar from '../components/layout/Sidebar';
import Dialog from '../components/ui/dialog';
import { FormSection, InputField, SelectField, CurrencyInputField, FileInput, FilePreview } from '../components/ui/FormComponents';
import { Building, Tag, MapPin, ImageIcon, Hash, DollarSign, Loader2, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

// --- Estado Inicial e Constantes ---
const initialFormState = {
  nomePropriedade: '', tipo: '', totalFracoes: '52', valorEstimado: '',
  enderecoCep: '', enderecoCidade: '', enderecoBairro: '', enderecoLogradouro: '',
  enderecoNumero: '', enderecoComplemento: '', enderecoPontoReferencia: '',
  documento: null, fotos: [],
};
const tiposPropriedade = ['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros'];

const RegisterProperty = () => {
  // --- Hooks e Estado ---
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('idle');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); 

  // --- Manipuladores de Eventos (Otimizados) ---
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleDocumentChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm(prev => ({ ...prev, documento: file }));
    setDocumentStatus('validating');
    const loadingToast = toast.loading('Validando documento com IA...');

    const { enderecoLogradouro, enderecoNumero, enderecoCep } = form;
    if (!enderecoLogradouro || !enderecoNumero || !enderecoCep) {
      toast.error('Preencha o CEP e o endereço completo antes de validar.', { id: loadingToast });
      setDocumentStatus('error');
      setForm(prev => ({ ...prev, documento: null }));
      return;
    }

    const formData = new FormData();
    formData.append('documento', file);
    formData.append('address', `${enderecoLogradouro}, ${enderecoNumero}`);
    formData.append('cep', enderecoCep);

    try {
      await api.post('/validation/address', formData);
      setDocumentStatus('success');
      toast.success('Documento validado com sucesso!', { id: loadingToast });
    } catch (error) {
      setDocumentStatus('error');
      toast.error(error.response?.data?.message || 'Falha na validação do documento.', { id: loadingToast });
      setForm(prev => ({ ...prev, documento: null }));
    }
  }, [form]);

  const handlePhotosChange = useCallback((e) => {
    const imageFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== e.target.files.length) {
      toast.error('Apenas arquivos de imagem (JPG, PNG, etc.) são permitidos.');
    }
    if (form.fotos.length + imageFiles.length > 15) {
      toast.error('Você pode enviar no máximo 15 fotos.');
      return;
    }
    setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...imageFiles] }));
  }, [form.fotos]);

  const removeFile = useCallback((fileType, index) => {
    if (fileType === 'documento') {
      setForm(prev => ({ ...prev, documento: null }));
      setDocumentStatus('idle');
    } else if (fileType === 'foto') {
      setForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
    }
  }, []);

  // --- Efeito para Busca de CEP ---
  useEffect(() => {
    const cep = form.enderecoCep.replace(/\D/g, '');
    if (cep.length === 8) {
      const fetchCep = async () => {
        try {
          const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
          if (!data.erro) {
            setForm(prev => ({ ...prev, enderecoLogradouro: data.logradouro, enderecoBairro: data.bairro, enderecoCidade: data.localidade }));
            toast.success('Endereço preenchido automaticamente!');
          } else {
            toast.error('CEP não encontrado.');
          }
        } catch (error) {
          toast.error('Não foi possível buscar o CEP.');
        }
      };
      fetchCep();
    }
  }, [form.enderecoCep]);

// --- Submissão do Formulário ---
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (documentStatus !== 'success') {
      toast.error('Por favor, valide um comprovante de endereço antes de continuar.');
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading('Cadastrando propriedade...');

    try {
      // Etapa 1: Criar a propriedade com os dados do formulário
      const propResponse = await api.post('/property/create', {
        nomePropriedade: form.nomePropriedade,
        tipo: form.tipo,
        totalFracoes: parseInt(form.totalFracoes, 10),
        valorEstimado: parseFloat(form.valorEstimado.replace(/\./g, '').replace(',', '.')) || null,
        enderecoCep: form.enderecoCep.replace(/\D/g, ''),
        enderecoCidade: form.enderecoCidade,
        enderecoBairro: form.enderecoBairro,
        enderecoLogradouro: form.enderecoLogradouro,
        enderecoNumero: form.enderecoNumero,
        enderecoComplemento: form.enderecoComplemento,
        enderecoPontoReferencia: form.enderecoPontoReferencia,
      });

      const propertyId = propResponse.data.data.id;
      if (!propertyId) throw new Error("A API não retornou o ID da propriedade criada.");

      // Etapa 2: Fazer upload dos arquivos em paralelo
      toast.loading('Enviando arquivos...', { id: loadingToast });
      const uploadPromises = [];

      if (form.documento) {
        const docFormData = new FormData();
        docFormData.append('documento', form.documento);
        docFormData.append('idPropriedade', propertyId.toString());
        docFormData.append('tipoDocumento', 'Comprovante_Endereco');
        uploadPromises.push(api.post('/propertyDocuments/upload', docFormData));
      }
      
      form.fotos.forEach(foto => {
        const fotoFormData = new FormData();
        fotoFormData.append('foto', foto);
        fotoFormData.append('idPropriedade', propertyId.toString());
        uploadPromises.push(api.post('/propertyPhoto/upload', fotoFormData));
      });

      await Promise.all(uploadPromises);

      toast.success('Propriedade cadastrada com sucesso!', { id: loadingToast });
      navigate(paths.home);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar. Verifique os campos.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [form, documentStatus, navigate]);

return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={clsx(
          "flex-1 p-4 sm:p-6 flex flex-col items-center transition-all duration-300",
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}>
          <div className="w-full max-w-4xl">
            <header className="mb-6 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Cadastrar Nova Propriedade</h1>
                    <p className="text-gray-500 mt-1">Preencha as informações para adicionar um novo bem à sua conta.</p>
                </div>
                <button onClick={() => setIsHelpModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition">
                    <HelpCircle size={18} />
                    <span>Manual</span>
                </button>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-8">
              {/* Seção de Informações Básicas */}
              <FormSection title="Informações Básicas" icon={<Building size={20} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField required label="Nome da Propriedade" name="nomePropriedade" value={form.nomePropriedade} onChange={handleInputChange} icon={<Tag size={16} />} />
                  <SelectField required label="Tipo de Propriedade" name="tipo" value={form.tipo} onChange={handleInputChange} options={tiposPropriedade} />
                  <CurrencyInputField label="Valor Estimado" name="valorEstimado" value={form.valorEstimado} onChange={handleInputChange} icon={<DollarSign size={16} />} />
                  <InputField required label="Número Total de Frações" name="totalFracoes" type="number" min="1" max="52" value={form.totalFracoes} onChange={handleInputChange} icon={<Hash size={16} />} />
                </div>
              </FormSection>

              {/* Seção de Endereço e Validação */}
              <FormSection title="Endereço e Validação" icon={<MapPin size={20} />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField required label="CEP" name="enderecoCep" value={form.enderecoCep} onChange={handleInputChange} maxLength={9} />
                    <InputField required label="Cidade" name="enderecoCidade" value={form.enderecoCidade} onChange={handleInputChange} className="md:col-span-2" />
                    <InputField required label="Bairro" name="enderecoBairro" value={form.enderecoBairro} onChange={handleInputChange} />
                    <InputField required label="Logradouro" name="enderecoLogradouro" value={form.enderecoLogradouro} onChange={handleInputChange} className="md:col-span-2" />
                    <InputField required label="Número" name="enderecoNumero" value={form.enderecoNumero} onChange={handleInputChange} />
                    <InputField label="Complemento" name="enderecoComplemento" value={form.enderecoComplemento} onChange={handleInputChange} className="md:col-span-2" />
                </div>
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comprovante de Endereço (APENAS PDF)</label>
                  {form.documento ? (
                    <FilePreview file={form.documento} status={documentStatus} onRemove={() => removeFile('documento')} />
                  ) : (
                    <FileInput name="documento" onChange={handleDocumentChange} accept=".pdf" />
                  )}
                </div>
              </FormSection>

            <FormSection title="Fotos da Propriedade" icon={<ImageIcon size={20} />}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adicione até 15 fotos</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
                  {form.fotos.map((file, index) => (
                    <FilePreview key={index} file={file} isImage onRemove={() => removeFile('foto', index)} />
                  ))}
                </div>
                {form.fotos.length < 15 && (
                  <FileInput name="fotos" onChange={handlePhotosChange} accept="image/*" multiple />
                )}
            </FormSection>

      {/* Botão de Submissão */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting || documentStatus !== 'success'}
                  className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Cadastrar Propriedade'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Modal de Ajuda */}
      <Dialog isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Manual de Cadastro">
          <div className="p-6 space-y-4 text-gray-700">
              <h4 className="font-bold">Número Total de Frações</h4>
              <p className="text-sm">Este campo define em quantas partes a propriedade será dividida. O padrão é 52, representando as semanas do ano. Cada fração dará direito a um número de dias de uso por ano (ex: 365 / 52 ≈ 7 dias).</p>
              <h4 className="font-bold">Comprovante de Endereço</h4>
              <p className="text-sm">Para garantir a segurança, você precisa enviar um comprovante de endereço válido em formato PDF. Preencha os campos de endereço e CEP, e depois envie o arquivo. Nossa IA irá validar se o endereço no documento corresponde ao que foi digitado.</p>
              <div className="flex justify-end pt-4 mt-4 border-t">
                  <button onClick={() => setIsHelpModalOpen(false)} className="px-6 py-2 bg-black text-white rounded-md font-semibold">Entendi</button>
              </div>
          </div>
      </Dialog>
    </>
  );
};

export default RegisterProperty;