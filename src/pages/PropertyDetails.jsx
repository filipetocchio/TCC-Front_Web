// Todos direitos autorais reservados pelo QOTA.

import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import InventoryModal from '../components/inventory/InventoryModal';
import InventoryGalleryModal from '../components/inventory/InventoryGalleryModal';
import Dialog from '../components/ui/dialog';

import {
  HomeIcon, Building2, MapPin, Archive, Calendar, Users, DollarSign,
  Pencil, Trash2, Image as ImageIcon, PlusCircle, X, UploadCloud,
  FileText, CheckCircle, XCircle, Loader2, Bell, LogOut, PieChart, UserCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
const API_BASE_URL = API_URL.replace('/api/v1', '');

const ICON_MAP = {
  Casa: <HomeIcon className="inline-block mr-1" size={18} />,
  Apartamento: <Building2 className="inline-block mr-1" size={18} />,
  Chacara: <MapPin className="inline-block mr-1" size={18} />,
  Lote: <Archive className="inline-block mr-1" size={18} />,
  Outros: <HomeIcon className="inline-block mr-1" size={18} />,
};

/**
 * Componente da página de detalhes da propriedade, servindo como hub central
 * para visualização de dados, gerenciamento de inventário e outras ações.
 */
const PropertyDetails = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados da página
  const [property, setProperty] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modais e diálogos
  const [editingProperty, setEditingProperty] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [showDeletePropertyDialog, setShowDeletePropertyDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  // Estados para formulários e arquivos
  const [propertyFormData, setPropertyFormData] = useState({});
  const [addressChanged, setAddressChanged] = useState(false);
  const [newDocument, setNewDocument] = useState(null);
  const [documentStatus, setDocumentStatus] = useState('idle');
  const [newPhotos, setNewPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  
  const [itemToEdit, setItemToEdit] = useState(null);
  const [inventoryFormData, setInventoryFormData] = useState({});
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);

 /**
   * Busca todos os dados necessários para a página, incluindo as notificações.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      const [propertyResponse, inventoryResponse, notificationsResponse] = await Promise.all([
        axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/inventory/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        
        axios.get(`${API_URL}/notification/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setProperty(propertyResponse.data.data);
      setPropertyFormData(propertyResponse.data.data);
      setInventory(inventoryResponse.data.data);
      setNotifications(notificationsResponse.data.data || []);
    } catch (error) {
      toast.error('Não foi possível carregar os dados da propriedade.');
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Memoiza os dados de permissão do usuário logado para otimizar a renderização.
   */
  const currentUserPermissions = useMemo(() => {
    if (!property || !usuario) {
      return { isMember: false, isMaster: false, cota: 0, vinculoId: null };
    }
    const userLink = property.usuarios.find(m => m.usuario?.id === usuario.id);
    if (!userLink) {
      return { isMember: false, isMaster: false, cota: 0, vinculoId: null };
    }
    return {
      isMember: true,
      isMaster: userLink.permissao === 'proprietario_master',
      cota: userLink.porcentagemCota,
      vinculoId: userLink.id,
    };
  }, [property, usuario]);

   /**
   * Identifica as notificações que o usuário atual ainda não leu.
   * A lógica verifica se o ID do usuário logado não está na lista 'lidaPor'.
   */
  const unreadNotifications = useMemo(() => {
    if (!usuario || !notifications) return [];
    return notifications.filter(n => 
      !n.lidaPor.some(userWhoRead => userWhoRead.id === usuario.id)
    );
  }, [notifications, usuario]);

 /**
   * Manipula o fechamento do modal de notificações. Se houver notificações
   * não lidas, envia seus IDs para a API para marcá-las como lidas.
   */
  const handleCloseNotificationModal = async () => {
    setIsNotificationModalOpen(false);
    const unreadIds = unreadNotifications.map(n => n.id);

    if (unreadIds.length > 0) {
      try {
        await axios.put(
          `${API_URL}/notification/read`,
          { notificationIds: unreadIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Atualiza o estado local para uma resposta visual instantânea,
        // adicionando o usuário atual à lista 'lidaPor' das notificações.
        setNotifications(currentNotifications => 
          currentNotifications.map(n => {
            if (unreadIds.includes(n.id)) {
              return { ...n, lidaPor: [...n.lidaPor, { id: usuario.id }] };
            }
            return n;
          })
        );
      } catch (error) {
        toast.error("Não foi possível marcar as notificações como lidas.");
      }
    }
  };
  
  /**
   * Permite que um usuário comum se desvincule da propriedade.
   */
  const handleUnlink = async () => {
    if (!currentUserPermissions.vinculoId) {
      toast.error("Não foi possível identificar seu vínculo com a propriedade.");
      return;
    }
    const loadingToast = toast.loading('Desvinculando da propriedade...');
    try {
      await axios.delete(
        `${API_URL}/permission/unlink/me/${currentUserPermissions.vinculoId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Você foi desvinculado com sucesso.', { id: loadingToast });
      navigate(paths.home);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível se desvincular.', { id: loadingToast });
    } finally {
      setShowUnlinkDialog(false);
    }
  };
  
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    setPropertyFormData((prev) => ({ ...prev, [name]: value }));
    const addressFields = ['enderecoCep', 'enderecoCidade', 'enderecoBairro', 'enderecoLogradouro', 'enderecoNumero'];
    if (addressFields.includes(name)) {
      setAddressChanged(true);
      setDocumentStatus('idle');
      setNewDocument(null);
    }
  };
  
  const handleNewDocumentChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewDocument(file);
    setDocumentStatus('validating');
    const loadingToast = toast.loading('Validando novo documento...');
    const fullAddress = `${propertyFormData.enderecoLogradouro}, ${propertyFormData.enderecoNumero}`;
    const validationFormData = new FormData();
    validationFormData.append('documento', file);
    validationFormData.append('address', fullAddress);
    validationFormData.append('cep', propertyFormData.enderecoCep);
    try {
      await axios.post(`${API_URL}/validation/address`, validationFormData, { headers: { Authorization: `Bearer ${token}` } });
      setDocumentStatus('success');
      toast.success('Novo comprovante validado com sucesso!', { id: loadingToast });
    } catch (error) {
      setDocumentStatus('error');
      toast.error(error.response?.data?.message || 'Falha na validação.', { id: loadingToast });
    }
  };
  
 /**
   * Manipula a seleção de novas fotos para a propriedade, garantindo que
   * apenas arquivos de imagem sejam processados e adicionados à pré-visualização.
   */
  const handleNewPhotosChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Filtra a seleção para incluir apenas arquivos cujo tipo MIME comece com "image/".
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));

    // Se a quantidade de arquivos válidos for diferente da seleção original,
    // notifica o usuário que apenas as imagens foram consideradas.
    if (imageFiles.length !== selectedFiles.length) {
      toast.error('Apenas arquivos de imagem (JPG, PNG, etc.) são permitidos.');
    }

    // Se não houver nenhuma imagem válida na seleção, interrompe a função.
    if (imageFiles.length === 0) {
        return;
    }
    
    // Adiciona apenas os arquivos de imagem válidos ao estado de pré-visualização.
    setNewPhotos(prev => [...prev, ...imageFiles]);
  };
  
  const queuePhotoForDeletion = (photoId) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setPropertyFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== photoId) }));
  };

  const removeNewPhoto = (indexToRemove) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdateProperty = async () => {
    if (addressChanged && documentStatus !== 'success') {
      toast.error('Você alterou o endereço. É obrigatório validar um novo comprovante.');
      return;
    }
    const loadingToast = toast.loading('Salvando alterações...');
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      await Promise.all(photosToDelete.map(photoId => axios.delete(`${API_URL}/propertyPhoto/${photoId}`, { headers: { Authorization: `Bearer ${accessToken}` } })));
      await Promise.all(newPhotos.map(file => {
        const photoFormData = new FormData();
        photoFormData.append('foto', file);
        photoFormData.append('idPropriedade', propertyId);
        return axios.post(`${API_URL}/propertyPhoto/upload`, photoFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
      }));
      if (newDocument) {
        const docFormData = new FormData();
        docFormData.append('documento', newDocument);
        docFormData.append('idPropriedade', propertyId);
        docFormData.append('tipoDocumento', 'Comprovante_Endereco_Atualizado');
        await axios.post(`${API_URL}/propertyDocuments/upload`, docFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
      }
      await axios.put(`${API_URL}/property/${propertyId}`, propertyFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success('Propriedade atualizada com sucesso!', { id: loadingToast });
      setEditingProperty(false);
      setAddressChanged(false);
      setNewDocument(null);
      setNewPhotos([]);
      setPhotosToDelete([]);
      fetchData();
    } catch (error) {
      toast.error('Ocorreu um erro ao salvar as alterações.', { id: loadingToast });
    }
  };

  const handleDeleteProperty = async () => {
    const loadingToast = toast.loading('Excluindo propriedade...');
    try {
      await axios.delete(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Propriedade excluída com sucesso.', { id: loadingToast });
      navigate(paths.home);
    } catch (error) {
      toast.error('Erro ao excluir a propriedade.', { id: loadingToast });
    }
  };

  const handleOpenInventoryModal = async (item = null) => {
    if (item) {
      const loadingToast = toast.loading("Carregando dados do item...");
      try {
        const accessToken = token || localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/inventory/${item.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setItemToEdit(response.data.data);
        setIsInventoryModalOpen(true);
        toast.dismiss(loadingToast);
      } catch (error) {
        toast.error("Não foi possível carregar os dados do item.", { id: loadingToast });
      }
    } else {
      setItemToEdit(null);
      setIsInventoryModalOpen(true);
    }
  };

  const handleCloseInventoryModal = () => {
    setIsInventoryModalOpen(false);
    setItemToEdit(null);
    fetchData();
  };

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault();
    const accessToken = token || localStorage.getItem('accessToken');
    const isEditing = !!itemToEdit;
    const loadingToast = toast.loading(isEditing ? 'Atualizando item...' : 'Adicionando item...');
    try {
      const { photoFiles, fotos, ...itemData } = inventoryFormData;

      if (isEditing) {
        await axios.put(
          `${API_URL}/inventory/${itemToEdit.id}`, 
          itemData, 
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (photoFiles && photoFiles.length > 0) {
          toast.loading('Enviando novas fotos...', { id: loadingToast });
          const uploadPromises = photoFiles.map(file => {
            const photoFormData = new FormData();
            photoFormData.append('photo', file);
            photoFormData.append('idItemInventario', itemToEdit.id);
            return axios.post(`${API_URL}/inventoryPhoto/upload`, photoFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
          });
          await Promise.all(uploadPromises);
        }
      } else {
        const response = await axios.post(
          `${API_URL}/inventory/create`, 
          { ...itemData, idPropriedade: Number(propertyId) },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        const createdItem = response.data.data;
        if (photoFiles && photoFiles.length > 0) {
          toast.loading('Enviando fotos...', { id: loadingToast });
          const uploadPromises = photoFiles.map(file => {
            const photoFormData = new FormData();
            photoFormData.append('photo', file);
            photoFormData.append('idItemInventario', createdItem.id);
            return axios.post(`${API_URL}/inventoryPhoto/upload`, photoFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
          });
          await Promise.all(uploadPromises);
        }
      }

      toast.success(isEditing ? 'Item atualizado com sucesso!' : 'Item adicionado com sucesso!', { id: loadingToast });
      handleCloseInventoryModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ocorreu um erro ao salvar o item.', { id: loadingToast });
    }
  };

  const handleOpenDeleteItemDialog = (item) => {
    setItemToDelete(item);
    setShowDeleteItemDialog(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const loadingToast = toast.loading('Excluindo item...');
    try {
      await axios.delete(`${API_URL}/inventory/${itemToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Item excluído com sucesso.', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir o item.', { id: loadingToast });
    } finally {
      setShowDeleteItemDialog(false);
      setItemToDelete(null);
    }
  };

  /**
   * Realiza o soft-delete de uma foto de inventário e atualiza o estado
   * do formulário do modal em tempo real para refletir a remoção.
   */
  const handlePhotoDelete = async (photoId) => {
    const loadingToast = toast.loading('Excluindo foto...');
    try {
      await axios.delete(`${API_URL}/inventoryPhoto/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });

      setInventoryFormData(prevFormData => ({
        ...prevFormData,
        fotos: prevFormData.fotos.filter(p => p.id !== photoId)
      }));
      
      toast.success('Foto excluída com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error('Não foi possível excluir a foto.', { id: loadingToast });
    }
  };

  if (loading || !property) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 md:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 md:ml-64">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                {ICON_MAP[property.tipo] ?? ICON_MAP['Outros']}{property.nomePropriedade}
              </h1>
              <p className="text-gray-500 mt-1">{property.enderecoLogradouro}, {property.enderecoCidade}</p>
              {currentUserPermissions.isMember && (
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <UserCheck size={16} className={currentUserPermissions.isMaster ? 'text-gold' : 'text-gray-500'}/>
                    {currentUserPermissions.isMaster ? 'Proprietário Master' : 'Proprietário Comum'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <PieChart size={16} className="text-blue-500"/>
                    {`${(currentUserPermissions.cota ?? 0).toFixed(2)}% de cota`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
                <ActionButton icon={<DollarSign size={16} />} text="Financeiro" />
                <ActionButton icon={<Calendar size={16} />} text="Agenda" />
                <ActionButton
                    icon={<Users size={16} />}
                    text="Cotistas"
                    onClick={() => navigate(paths.gerenciarMembros.replace(':id', propertyId))}
                />
                <NotificationBell unreadCount={unreadNotifications.length} onClick={() => setIsNotificationModalOpen(true)} />
            </div>
          </div>

          <div className="mb-8 bg-white rounded-2xl shadow-md overflow-hidden max-w-3xl mx-auto">
            {property.fotos?.length > 0 ? (
              <div className="relative pt-[56.25%] w-full">
                <img src={`${API_BASE_URL}${property.fotos[activeImage]?.documento}`} alt={`Foto ${activeImage + 1}`} className="absolute top-0 left-0 w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {property.fotos.map((_, index) => (<button key={index} onClick={() => setActiveImage(index)} className={`w-3 h-3 rounded-full transition-all ${activeImage === index ? 'bg-gold w-6' : 'bg-white bg-opacity-50'}`} />))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={48} className="mb-4" />
                <p>Nenhuma foto disponível para esta propriedade</p>
              </div>
            )}
            
            {editingProperty && (
              <div className="p-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Gerenciar Fotos</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
                  {propertyFormData.fotos?.map(photo => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img src={`${API_BASE_URL}${photo.documento}`} alt="Foto da propriedade" className="w-full h-full object-cover rounded-md" />
                      <button 
                        onClick={() => queuePhotoForDeletion(photo.id)}
                        className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        title="Marcar para excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {newPhotos.map((file, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={URL.createObjectURL(file)} alt="Nova foto" className="w-full h-full object-cover rounded-md border-2 border-green-500" />
                      <button 
                        onClick={() => removeNewPhoto(index)}
                        className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover nova foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <FileInput name="newPhotos" onChange={handleNewPhotosChange} multiple accept="image/*" />
              </div>
            )}
            
            <div className="p-4 flex justify-center gap-4 border-t">
              {currentUserPermissions.isMaster && !editingProperty && (
                <>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2" onClick={() => setEditingProperty(true)}>
                    <Pencil size={16} />Editar Propriedade
                  </button>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={() => setShowDeletePropertyDialog(true)}>
                    <Trash2 size={16} /> Excluir Propriedade
                  </button>
                </>
              )}
              {!currentUserPermissions.isMaster && currentUserPermissions.isMember && (
                  <button className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition flex items-center gap-2" onClick={() => setShowUnlinkDialog(true)}>
                    <LogOut size={16} /> Desvincular da Propriedade
                  </button>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Detalhes da Propriedade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
              {editingProperty ? (
                <>
                  <PropertyFormSection title="Informações Básicas" formData={propertyFormData} onChange={handlePropertyFormChange} />
                  <PropertyFormSection title="Endereço" formData={propertyFormData} onChange={handlePropertyFormChange} isAddress/>
                  {addressChanged && (
                    <div className="md:col-span-2 p-4 border-l-4 border-yellow-400 bg-yellow-50">
                      <h4 className="font-bold text-yellow-800">Ação Necessária</h4>
                      <p className="text-sm text-yellow-700">Você alterou o endereço. Para salvar, é obrigatório enviar e validar um novo comprovante em PDF.</p>
                      <div className="mt-4">
                        {newDocument ? (
                          <div className="flex items-center gap-3 p-2 border rounded-md bg-gray-50">
                            <FileText size={20} className="text-gray-500" />
                            <span className="text-sm truncate">{newDocument.name}</span>
                            <div className="ml-auto flex items-center gap-2">
                              {documentStatus === 'validating' && <Loader2 size={20} className="animate-spin text-blue-500" />}
                              {documentStatus === 'success' && <CheckCircle size={20} className="text-green-500" />}
                              {documentStatus === 'error' && <XCircle size={20} className="text-red-500" />}
                              <button type="button" onClick={() => setNewDocument(null)}><X size={18} /></button>
                            </div>
                          </div>
                        ) : (
                          <FileInput name="newDocument" onChange={handleNewDocumentChange} accept=".pdf" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <DetailItem label="Tipo" value={property.tipo} />
                    <DetailItem label="Valor estimado" value={property.valorEstimado ? `R$ ${Number(property.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Não informado'} />
                  </div>
                  <div className="space-y-4">
                    <DetailItem label="Endereço Completo" value={`${property.enderecoLogradouro || ''}, ${property.enderecoNumero || ''}\n${property.enderecoBairro || ''}, ${property.enderecoCidade || ''}\nCEP: ${property.enderecoCep || ''}`} />
                    <DetailItem label="Complemento" value={property.enderecoComplemento || 'Não informado'} />
                    <DetailItem label="Ponto de Referência" value={property.enderecoPontoReferencia || 'Não informado'} />
                  </div>
                </>
              )}
            </div>
            {editingProperty && (
              <div className="mt-8 flex justify-end gap-4">
                  <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold" onClick={() => setEditingProperty(false)}>
                    Cancelar
                  </button>
                  <button 
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:bg-gray-400" 
                    onClick={handleUpdateProperty}
                    disabled={addressChanged && documentStatus !== 'success'}
                  >
                    Salvar Alterações
                  </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-2xl font-semibold text-gray-800">Inventário</h2>
              {currentUserPermissions.isMember && (
                <button onClick={() => handleOpenInventoryModal(null)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  <PlusCircle size={18} />Adicionar Item
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>{currentUserPermissions.isMember && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}</tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.length > 0 ? (inventory.map(item => (<tr key={item.id}><td className="px-4 py-3"><div className="flex items-center cursor-pointer" onClick={() => setGalleryItem(item)}>{item.fotos && item.fotos.length > 0 ? (<img src={`${API_BASE_URL}${item.fotos[0].url}`} alt={item.nome} className="h-10 w-10 rounded-md object-cover" />) : (<div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>)}{item.fotos && item.fotos.length > 1 && (<span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">+{item.fotos.length - 1}</span>)}</div></td><td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td><td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={item.descricao}>{item.descricao || '-'}</td><td className="px-4 py-3 text-gray-600">{item.quantidade}</td><td className="px-4 py-3 text-gray-600">{item.estadoConservacao}</td>{currentUserPermissions.isMember && <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleOpenInventoryModal(item)} className="text-indigo-600 hover:text-indigo-900 font-medium">Editar</button><button onClick={() => handleOpenDeleteItemDialog(item)} className="text-red-600 hover:text-red-900 ml-4 font-medium">Excluir</button></td>}</tr>))) : (<tr><td colSpan={currentUserPermissions.isMember ? "6" : "5"} className="px-6 py-4 text-center text-gray-500">Nenhum item cadastrado.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <NotificationModal isOpen={isNotificationModalOpen} onClose={handleCloseNotificationModal} notifications={notifications} />
      <Dialog isOpen={showUnlinkDialog} onClose={() => setShowUnlinkDialog(false)} title="Confirmar Desvinculação">
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-lg">Tem certeza que deseja se desvincular desta propriedade? Sua cota será devolvida ao proprietário master.</p>
          <div className="flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setShowUnlinkDialog(false)}>Cancelar</button>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={handleUnlink}><LogOut size={16} />Confirmar</button>
          </div>
        </div>
      </Dialog>
      <Dialog isOpen={showDeletePropertyDialog} onClose={() => setShowDeletePropertyDialog(false)} title="Confirmar exclusão de propriedade">
        <div className="p-6">
            <p className="text-gray-700 mb-6 text-lg">Tem certeza que deseja excluir permanentemente a propriedade &quot;{property?.nomePropriedade}&quot;? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-4">
                <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setShowDeletePropertyDialog(false)}>Cancelar</button>
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={handleDeleteProperty}><Trash2 size={16} />Confirmar Exclusão</button>
            </div>
        </div>
      </Dialog>
      <Dialog isOpen={showDeleteItemDialog} onClose={() => setShowDeleteItemDialog(false)} title="Confirmar exclusão de item">
        <div className="p-6">
            <p className="text-gray-700 mb-6 text-lg">Tem certeza que deseja excluir o item &quot;{itemToDelete?.nome}&quot;?</p>
            <div className="flex justify-end gap-4">
                <button className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition" onClick={() => setShowDeleteItemDialog(false)}>Cancelar</button>
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={handleConfirmDeleteItem}><Trash2 size={16} />Confirmar</button>
            </div>
        </div>
      </Dialog>
      <InventoryModal isOpen={isInventoryModalOpen} onClose={handleCloseInventoryModal} formData={inventoryFormData} setFormData={setInventoryFormData} handleSubmit={handleSaveInventoryItem} itemToEdit={itemToEdit} onPhotoDelete={handlePhotoDelete} />
      <InventoryGalleryModal isOpen={!!galleryItem} onClose={() => setGalleryItem(null)} photos={galleryItem?.fotos || []} />
    </>
  );
};

// --- Componentes Auxiliares ---

const NotificationBell = ({ unreadCount, onClick }) => (
  <button onClick={onClick} className="relative p-2 text-gray-600 hover:text-black transition-colors">
    <Bell size={24} />
    {unreadCount > 0 && (
      <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-gray-50">
        {unreadCount}
      </span>
    )}
  </button>
);
NotificationBell.propTypes = { unreadCount: PropTypes.number.isRequired, onClick: PropTypes.func.isRequired };

const NotificationModal = ({ isOpen, onClose, notifications }) => {
    if (!isOpen) return null;
    
    const displayNotifications = notifications || [];

    return (
      <Dialog isOpen={isOpen} onClose={onClose} title="Central de Notificações">
        <div className="p-4 max-h-96 overflow-y-auto">
          {displayNotifications.length > 0 ? (
            <ul className="space-y-3">
              {displayNotifications.map(n => (
                <li key={n.id} className="p-3 bg-gray-100 rounded-lg text-sm">
                  <p className="text-gray-800">{n.mensagem}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('pt-BR')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhuma notificação por enquanto.</p>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold">Fechar</button>
        </div>
      </Dialog>
    );
};
NotificationModal.propTypes = { isOpen: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, notifications: PropTypes.array.isRequired };

const ActionButton = ({ icon, text, onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-gold text-black rounded-xl hover:bg-yellow-500 transition-colors flex items-center font-semibold shadow-sm">
    {icon}
    <span className="ml-2">{text}</span>
  </button>
);
ActionButton.propTypes = { icon: PropTypes.node.isRequired, text: PropTypes.string.isRequired, onClick: PropTypes.func };

const PropertyFormSection = ({ title, formData, onChange, isAddress = false }) => {
  const fields = isAddress
    ? [ { name: 'enderecoLogradouro', label: 'Logradouro', type: 'text' }, { name: 'enderecoNumero', label: 'Número', type: 'text' }, { name: 'enderecoBairro', label: 'Bairro', type: 'text' }, { name: 'enderecoCidade', label: 'Cidade', type: 'text' }, { name: 'enderecoCep', label: 'CEP', type: 'text' }, { name: 'enderecoComplemento', label: 'Complemento', type: 'text' }, { name: 'enderecoPontoReferencia', label: 'Ponto de Referência', type: 'text' } ]
    : [ { name: 'nomePropriedade', label: 'Nome', type: 'text' }, { name: 'tipo', label: 'Tipo', type: 'select', options: ['Casa', 'Apartamento', 'Chácara', 'Lote', 'Outros'] }, { name: 'valorEstimado', label: 'Valor estimado', type: 'currency' } ];
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {fields.map((field) => {
          if (field.type === 'currency') {
            return (
              <CurrencyInputField
                key={field.name}
                label={field.label}
                name={field.name}
                value={formData[field.name]}
                onChange={onChange}
              />
            );
          }
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}:</label>
              {field.type === 'select' ? (
                <select name={field.name} value={formData[field.name] || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent">
                  {field.options.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              ) : (
                <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
PropertyFormSection.propTypes = { title: PropTypes.string.isRequired, formData: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired, isAddress: PropTypes.bool };

const CurrencyInputField = ({ label, name, value, onChange }) => {
    const handleCurrencyChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        if (rawValue === '') {
            onChange({ target: { name, value: '' } });
            return;
        }
        const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(rawValue) / 100);
        onChange({ target: { name, value: formattedValue } });
    };
    const displayValue = typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value) : (value || '');
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
            <input type="text" name={name} value={displayValue} onChange={handleCurrencyChange} placeholder="0,00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
        </div>
    );
};
CurrencyInputField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), onChange: PropTypes.func.isRequired };

const DetailItem = ({ label, value }) => (
  <div>
    <p className="font-medium text-gray-800">{label}:</p>
    <p className="text-gray-600 whitespace-pre-wrap">{value}</p>
  </div>
);
DetailItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired };

const FileInput = (props) => (
  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gold transition-colors">
    <UploadCloud size={24} className="mx-auto text-gray-400" />
    <p className="mt-1 text-sm text-gray-600">Arraste ou <span className="font-semibold text-gold">clique para enviar</span></p>
    <input type="file" {...props} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
  </div>
);
FileInput.propTypes = { name: PropTypes.string, onChange: PropTypes.func, multiple: PropTypes.bool, accept: PropTypes.string };

export default PropertyDetails;

