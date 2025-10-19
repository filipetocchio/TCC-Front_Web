// Todos direitos autorais reservados pelo QOTA.

/**
 * Biblioteca de Componentes para a Página de Detalhes da Propriedade
 *
 * Descrição:
 * Este arquivo contém todos os subcomponentes principais que compõem a página
 * `PropertyDetails`. A componentização melhora a legibilidade, a manutenibilidade
 * e a performance, permitindo que cada parte da UI seja otimizada e gerenciada
 * de forma independente.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import paths from '../../routes/paths';
import { FormSection, InputField, SelectField, CurrencyInputField, FileInput, FilePreview } from '../ui/FormComponents';
import { DeletePropertyDialog } from './PropertyDialogs';
import { NotificationBell } from '../ui/NotificationComponents';
import {
  Home as HomeIcon, Building2, MapPin, Archive, Pencil, Trash2, LogOut,
  ImageIcon, PieChart, UserCheck, Loader2, Hash, DollarSign, Tag, X,
  ChevronLeft, ChevronRight // Adicione estes ícones
} from 'lucide-react';

// Constante para a URL base da API, usada para construir caminhos de imagens.
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

const ICON_MAP = {
  Casa: <HomeIcon className="inline-block mr-1" size={18} />,
  Apartamento: <Building2 className="inline-block mr-1" size={18} />,
  Chacara: <MapPin className="inline-block mr-1" size={18} />,
  Lote: <Archive className="inline-block mr-1" size={18} />,
  Outros: <HomeIcon className="inline-block mr-1" size={18} />,
};

/**
 * Exibe o cabeçalho da página com informações da propriedade e do usuário.
 */
export const PropertyHeader = React.memo(({ property, permissions, onNotificationClick, unreadCount }) => (
  <header className="flex justify-between items-start mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        {ICON_MAP[property.tipo] ?? ICON_MAP['Outros']}{property.nomePropriedade}
      </h1>
      <p className="text-gray-500 mt-1">{property.enderecoLogradouro}, {property.enderecoCidade}</p>
      {permissions.isMember && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1 font-semibold">
            <UserCheck size={16} className={permissions.isMaster ? 'text-gold' : 'text-gray-500'}/>
            {permissions.isMaster ? 'Proprietário Master' : 'Proprietário Comum'}
          </span>
          <span className="flex items-center gap-1 font-semibold">
            <PieChart size={16} className="text-blue-500"/>
            {`${permissions.numeroDeFracoes} Fração(ões)`}
          </span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-3">
      <NotificationBell unreadCount={unreadCount} onClick={onNotificationClick} />
    </div>
  </header>
));
PropertyHeader.displayName = 'PropertyHeader';
PropertyHeader.propTypes = {
  property: PropTypes.object.isRequired,
  permissions: PropTypes.object.isRequired,
  onNotificationClick: PropTypes.func.isRequired,
  unreadCount: PropTypes.number.isRequired,
};

/**
 * Exibe a galeria de fotos da propriedade com um carrossel interativo.
 */
export const PropertyGallery = React.memo(({ photos, apiBaseUrl }) => {
  const [activeImage, setActiveImage] = useState(0);

  const goToPrevious = useCallback(() => {
    setActiveImage(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setActiveImage(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  if (!photos || photos.length === 0) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-md h-64 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon size={48} className="mb-4" />
        <p>Nenhuma foto disponível para esta propriedade</p>
      </div>
    );
  }

  return (
    <div className="mb-8 max-w-4xl mx-auto">
      {/* Container flex para alinhar as setas nas laterais da imagem */}
      <div className="flex items-center justify-center gap-2">
        {/* Botão Anterior (fora da imagem) */}
        <button 
          onClick={goToPrevious} 
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-black transition-colors disabled:opacity-0"
          aria-label="Foto anterior"
          disabled={photos.length <= 1}
        >
          <ChevronLeft size={32} />
        </button>

        {/* Container da Imagem e Pontos */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full">
          <div className="relative pt-[56.25%]">
            <img src={`${apiBaseUrl}${photos[activeImage]?.documento}`} alt={`Foto ${activeImage + 1}`} className="absolute top-0 left-0 w-full h-full object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {photos.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => setActiveImage(index)} 
                  className={`w-2.5 h-2.5 rounded-full transition-all ${activeImage === index ? 'bg-gold' : 'bg-white bg-opacity-50'}`} 
                  aria-label={`Ir para a foto ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Botão Próximo (fora da imagem) */}
        <button 
          onClick={goToNext} 
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-black transition-colors disabled:opacity-0"
          aria-label="Próxima foto"
          disabled={photos.length <= 1}
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
});
PropertyGallery.displayName = 'PropertyGallery';
PropertyGallery.propTypes = {
  photos: PropTypes.array,
  apiBaseUrl: PropTypes.string.isRequired,
};

/**
 * Exibe os botões de ação (Editar, Excluir, Sair) com base nas permissões.
 */
export const PropertyActions = React.memo(({ permissions, onUnlink, onToggleEdit, onDeleteClick, isEditing }) => (
    <div className="p-4 flex justify-center gap-4 mb-8">
        {permissions.isMaster && !isEditing && (
            <>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2" onClick={onToggleEdit}>
                    <Pencil size={16} />Editar Propriedade
                </button>
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={onDeleteClick}>
                    <Trash2 size={16} /> Excluir Propriedade
                </button>
            </>
        )}
        {permissions.isMember && !isEditing && (
            <button className="px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition flex items-center gap-2" onClick={onUnlink}>
                <LogOut size={16} /> Sair da Propriedade
            </button>
        )}
    </div>
));
PropertyActions.displayName = 'PropertyActions';
PropertyActions.propTypes = {
    permissions: PropTypes.object.isRequired,
    onUnlink: PropTypes.func.isRequired,
    onToggleEdit: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    isEditing: PropTypes.bool.isRequired,
};

/**
 * Componente de item de detalhe para o modo de visualização.
 */
const DetailItem = React.memo(({ label, value }) => (
    <div>
      <p className="font-medium text-gray-800">{label}:</p>
      <p className="text-gray-600 whitespace-pre-wrap">{value || 'Não informado'}</p>
    </div>
));
DetailItem.displayName = 'DetailItem';
DetailItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) };

/**
 * Gerencia a exibição e o formulário de edição dos detalhes da propriedade.
 */
export const PropertyDetailsSection = ({ property, permissions, onDataChange, onUnlink }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [addressChanged, setAddressChanged] = useState(false);
  const [newDocument, setNewDocument] = useState(null);
  const [documentStatus, setDocumentStatus] = useState('idle');
  const [newPhotos, setNewPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (property) {
        // Converte o valor numérico para string formatada para o CurrencyInputField
        const initialFormData = {
            ...property,
            valorEstimado: property.valorEstimado ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(property.valorEstimado) : '',
        };
        setFormData(initialFormData);
    }
  }, [property, isEditing]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const addressFields = ['enderecoCep', 'enderecoCidade', 'enderecoBairro', 'enderecoLogradouro', 'enderecoNumero'];
    if (addressFields.includes(name)) {
      setAddressChanged(true);
      setDocumentStatus('idle');
      setNewDocument(null);
    }
  }, []);
  
  const handleNewDocumentChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewDocument(file);
    setDocumentStatus('validating');
    const loadingToast = toast.loading('Validando novo documento...');
    const { enderecoLogradouro, enderecoNumero, enderecoCep } = formData;
    if (!enderecoLogradouro || !enderecoNumero || !enderecoCep) {
      toast.error('Preencha o CEP e o endereço completo antes de validar.', { id: loadingToast });
      setDocumentStatus('error');
      setNewDocument(null);
      return;
    }
    const validationFormData = new FormData();
    validationFormData.append('documento', file);
    validationFormData.append('address', `${enderecoLogradouro}, ${enderecoNumero}`);
    validationFormData.append('cep', enderecoCep);
    try {
      await api.post('/validation/address', validationFormData);
      setDocumentStatus('success');
      toast.success('Novo comprovante validado com sucesso!', { id: loadingToast });
    } catch (error) {
      setDocumentStatus('error');
      toast.error(error.response?.data?.message || 'Falha na validação.', { id: loadingToast });
    }
  }, [formData]);
  
  const handleNewPhotosChange = useCallback((e) => {
    const imageFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== e.target.files.length) toast.error('Apenas arquivos de imagem são permitidos.');
    const totalPhotos = (formData.fotos?.length || 0) + newPhotos.length + imageFiles.length;
    if (totalPhotos > 15) {
      toast.error('Você pode ter no máximo 15 fotos.');
      return;
    }
    setNewPhotos(prev => [...prev, ...imageFiles]);
  }, [formData.fotos, newPhotos]);

  const queuePhotoForDeletion = useCallback((photoId) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== photoId) }));
  }, []);

  const removeNewPhoto = useCallback((indexToRemove) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleUpdateProperty = useCallback(async () => {
    if (addressChanged && documentStatus !== 'success') {
      toast.error('Você alterou o endereço. É obrigatório validar um novo comprovante.');
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading('Salvando alterações...');

    try {
      // Executa todas as operações de arquivo em paralelo
      const filePromises = [];
      photosToDelete.forEach(photoId => filePromises.push(api.delete(`/propertyPhoto/${photoId}`)));
      newPhotos.forEach(file => {
        const photoFormData = new FormData();
        photoFormData.append('foto', file);
        photoFormData.append('idPropriedade', property.id);
        filePromises.push(api.post('/propertyPhoto/upload', photoFormData));
      });
      if (newDocument) {
        const docFormData = new FormData();
        docFormData.append('documento', newDocument);
        docFormData.append('idPropriedade', property.id);
        docFormData.append('tipoDocumento', 'Comprovante_Endereco_Atualizado');
        filePromises.push(api.post('/propertyDocuments/upload', docFormData));
      }
      await Promise.all(filePromises);

      // Após os arquivos, atualiza os dados da propriedade
      const dataToSend = { ...formData, totalFracoes: parseInt(formData.totalFracoes, 10) };
      await api.put(`/property/${property.id}`, dataToSend);

      toast.success('Propriedade atualizada com sucesso!', { id: loadingToast });
      setIsEditing(false);
      setAddressChanged(false);
      setNewDocument(null);
      setNewPhotos([]);
      setPhotosToDelete([]);
      onDataChange();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ocorreu um erro ao salvar.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [addressChanged, documentStatus, formData, newDocument, newPhotos, photosToDelete, property?.id, onDataChange]);
  
const handleDeleteProperty = useCallback(async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Excluindo propriedade...');
    try {
      await api.delete(`/property/${property.id}`);
      toast.success('Propriedade excluída com sucesso.', { id: loadingToast });
      navigate(paths.home);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao excluir a propriedade.', { id: loadingToast });
    } finally {
      setShowDeleteDialog(false);
      setIsSubmitting(false);
    }
  }, [property?.id, navigate]);
  
  return (
    <>
      <PropertyActions
        permissions={permissions}
        onUnlink={onUnlink}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onDeleteClick={() => setShowDeleteDialog(true)}
        isEditing={isEditing}
      />
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Detalhes da Propriedade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
          {isEditing ? (
            <>
              {/* Formulário de Edição Completo */}
              <FormSection title="Informações Básicas">
                <InputField required label="Nome da Propriedade" name="nomePropriedade" value={formData.nomePropriedade || ''} onChange={handleInputChange} icon={<Tag size={16} />} />
                <SelectField required label="Tipo de Propriedade" name="tipo" value={formData.tipo || ''} onChange={handleInputChange} options={['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros']} />
                <CurrencyInputField label="Valor Estimado" name="valorEstimado" value={formData.valorEstimado || ''} onChange={handleInputChange} icon={<DollarSign size={16} />} />
                <InputField required label="Número Total de Frações" name="totalFracoes" type="number" min="1" max="52" value={formData.totalFracoes || ''} onChange={handleInputChange} icon={<Hash size={16} />} />
              </FormSection>
              
              <FormSection title="Endereço">
                <InputField required label="CEP" name="enderecoCep" value={formData.enderecoCep || ''} onChange={handleInputChange} maxLength={9} />
                <InputField required label="Cidade" name="enderecoCidade" value={formData.enderecoCidade || ''} onChange={handleInputChange} />
                <InputField required label="Bairro" name="enderecoBairro" value={formData.enderecoBairro || ''} onChange={handleInputChange} />
                <InputField required label="Logradouro" name="enderecoLogradouro" value={formData.enderecoLogradouro || ''} onChange={handleInputChange} />
                <InputField required label="Número" name="enderecoNumero" value={formData.enderecoNumero || ''} onChange={handleInputChange} />
                <InputField label="Complemento" name="enderecoComplemento" value={formData.enderecoComplemento || ''} onChange={handleInputChange} />
              </FormSection>

              <div className="md:col-span-2">
                <FormSection title="Gerenciar Fotos">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
                        {formData.fotos?.map(photo => (
                            <FilePreview key={photo.id} isImage imageUrl={`${API_BASE_URL}${photo.documento}`} onRemove={() => queuePhotoForDeletion(photo.id)} file={{name: `Foto ${photo.id}`}} />
                        ))}
                        {newPhotos.map((file, index) => (
                            <FilePreview key={index} file={file} isImage onRemove={() => removeNewPhoto(index)} />
                        ))}
                    </div>
                    {((formData.fotos?.length || 0) + newPhotos.length) < 15 && (
                        <FileInput name="newPhotos" onChange={handleNewPhotosChange} multiple accept="image/*" />
                    )}
                </FormSection>
              </div>
              
              {addressChanged && (
                <div className="md:col-span-2 p-4 border-l-4 border-yellow-400 bg-yellow-50">
                  <h4 className="font-bold text-yellow-800">Ação Necessária</h4>
                  <p className="text-sm text-yellow-700">Você alterou o endereço. Para salvar, é obrigatório enviar e validar um novo comprovante em PDF.</p>
                  <div className="mt-4">
                    {newDocument ? (
                      <FilePreview file={newDocument} status={documentStatus} onRemove={() => setNewDocument(null)} />
                    ) : (
                      <FileInput name="newDocument" onChange={handleNewDocumentChange} accept=".pdf" />
                    )}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2 mt-8 flex justify-end gap-4 border-t pt-6">
                <button disabled={isSubmitting} onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold">Cancelar</button>
                <button disabled={isSubmitting || (addressChanged && documentStatus !== 'success')} onClick={handleUpdateProperty} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex justify-center items-center w-48 disabled:bg-gray-400">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <DetailItem label="Tipo" value={property.tipo} />
                <DetailItem label="Valor estimado" value={property.valorEstimado ? `R$ ${Number(property.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
                <DetailItem label="Total de Frações" value={property.totalFracoes} />
              </div>
              <div className="space-y-4">
                <DetailItem label="Endereço Completo" value={`${property.enderecoLogradouro || ''}, ${property.enderecoNumero || ''}\n${property.enderecoBairro || ''}, ${property.enderecoCidade || ''}\nCEP: ${property.enderecoCep || ''}`} />
                <DetailItem label="Complemento" value={property.enderecoComplemento} />
              </div>
            </>
          )}
        </div>
      </div>
      <DeletePropertyDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProperty}
        isSubmitting={isSubmitting}
        propertyName={property?.nomePropriedade}
      />
    </>
  );
};
PropertyDetailsSection.propTypes = {
    property: PropTypes.object.isRequired,
    permissions: PropTypes.object.isRequired,
    onDataChange: PropTypes.func.isRequired,
    onUnlink: PropTypes.func.isRequired,
};