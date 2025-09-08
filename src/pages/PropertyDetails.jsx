/**
 * @file PropertyDetails.jsx
 * @description Componente de página que exibe os detalhes completos de uma propriedade,
 * incluindo informações gerais, galeria de fotos e o módulo de gestão de inventário.
 * Atua como o hub central para todas as ações relacionadas a uma propriedade específica.
 */
import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import InventoryModal from '../components/inventory/InventoryModal';
import InventoryGalleryModal from '../components/inventory/InventoryGalleryModal';
import Dialog from '../components/ui/dialog';

import {
  HomeIcon, Building2, MapPin, Archive, FileText, Calendar, Users,
  DollarSign, Pencil, Trash2, Image as ImageIcon, PlusCircle, X
} from 'lucide-react';

// --- Constantes de Configuração ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
const API_BASE_URL = API_URL.replace('/api/v1', '');

const ICON_MAP = {
  Casa: <HomeIcon className="inline-block mr-1" size={18} />,
  Apartamento: <Building2 className="inline-block mr-1" size={18} />,
  Chácara: <MapPin className="inline-block mr-1" size={18} />,
  Lote: <Archive className="inline-block mr-1" size={18} />,
  Outros: <HomeIcon className="inline-block mr-1" size={18} />,
};

// --- Componente Principal ---
const PropertyDetails = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados da Propriedade
  const [property, setProperty] = useState(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState({});
  const [showDeletePropertyDialog, setShowDeletePropertyDialog] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Estados do Inventário
  const [inventory, setInventory] = useState([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [inventoryFormData, setInventoryFormData] = useState({});
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);

  /**
   * @function fetchData
   * @description Busca os dados da propriedade e do inventário de forma concorrente.
   * Utiliza `Promise.all` para otimizar o carregamento dos dados da página.
   * Memoizada com `useCallback` para estabilidade referencial.
   */
  const fetchData = useCallback(async () => {
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      const [propertyResponse, inventoryResponse] = await Promise.all([
        axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/inventory/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setProperty(propertyResponse.data.data);
      setPropertyFormData(propertyResponse.data.data);
      setInventory(inventoryResponse.data.data);
    } catch (error) {
      toast.error('Não foi possível carregar os dados da propriedade.');
      console.error('Erro ao buscar dados da página:', error);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  /**
   * @property {boolean} isOwnerMaster
   * @description Estado derivado e memoizado que verifica se o usuário logado é um
   * proprietário master da propriedade atual. `useMemo` otimiza o cálculo.
   */
  const isOwnerMaster = useMemo(() => {
    // A verificação agora aponta para 'm.usuario.id', corrigindo o bug.
    return property?.usuarios?.some(m => m.usuario?.id === usuario?.id && m.permissao === 'proprietario_master');
  }, [property, usuario]);

  // --- Manipuladores de Eventos da Propriedade ---
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    setPropertyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProperty = async () => {
    const loadingToast = toast.loading('Atualizando propriedade...');
    try {
      const response = await axios.put(`${API_URL}/property/${propertyId}`, propertyFormData, { headers: { Authorization: `Bearer ${token}` } });
      setProperty(response.data.data);
      setEditingProperty(false);
      toast.success('Propriedade atualizada com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error('Erro ao atualizar a propriedade.', { id: loadingToast });
    }
  };

  const handleDeleteProperty = async () => {
    const loadingToast = toast.loading('Excluindo propriedade...');
    try {
      await axios.delete(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Propriedade excluída com sucesso.', { id: loadingToast });
      navigate('/home');
    } catch (error) {
      toast.error('Erro ao excluir a propriedade.', { id: loadingToast });
    }
  };

  // --- Manipuladores de Eventos do Inventário ---
  const handleOpenInventoryModal = (item = null) => {
    setItemToEdit(item);
    setIsInventoryModalOpen(true);
  };

  const handleCloseInventoryModal = () => {
    setIsInventoryModalOpen(false);
    setItemToEdit(null);
  };

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault();
    const accessToken = token || localStorage.getItem('accessToken');
    const isEditing = !!itemToEdit;
    const loadingToast = toast.loading(isEditing ? 'Atualizando item...' : 'Adicionando item...');

    try {
      if (isEditing) {
        const response = await axios.put(`${API_URL}/inventory/${itemToEdit.id}`, inventoryFormData, { headers: { Authorization: accessToken } });
        setInventory(current => current.map(item => item.id === itemToEdit.id ? { ...item, ...response.data.data } : item));
        toast.success('Item atualizado com sucesso!', { id: loadingToast });
      } else {
        const itemData = { ...inventoryFormData, idPropriedade: Number(propertyId) };
        delete itemData.photoFiles;
        const response = await axios.post(`${API_URL}/inventory/create`, itemData, { headers: { Authorization: accessToken } });
        let createdItem = response.data.data;
        if (inventoryFormData.photoFiles && inventoryFormData.photoFiles.length > 0) {
          toast.loading('Enviando fotos...', { id: loadingToast });
          const uploadPromises = inventoryFormData.photoFiles.map(file => {
            const photoFormData = new FormData();
            photoFormData.append('photo', file);
            photoFormData.append('idItemInventario', createdItem.id);
            return axios.post(`${API_URL}/inventoryPhoto/upload`, photoFormData, { headers: { Authorization: `Bearer ${accessToken}` } });
          });
          const photoResponses = await Promise.all(uploadPromises);
          createdItem.fotos = photoResponses.map(res => res.data.data);
        }
        setInventory(current => [...current, createdItem]);
        toast.success('Item adicionado com sucesso!', { id: loadingToast });
      }
      handleCloseInventoryModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ocorreu um erro.', { id: loadingToast });
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
      setInventory(current => current.filter(i => i.id !== itemToDelete.id));
      setShowDeleteItemDialog(false);
      setItemToDelete(null);
      toast.success('Item excluído com sucesso.', { id: loadingToast });
    } catch (error) {
      toast.error('Erro ao excluir o item.', { id: loadingToast });
    }
  };

  const handlePhotoDelete = async (photoId, itemId) => {
    const loadingToast = toast.loading('Excluindo foto...');
    try {
      await axios.delete(`${API_URL}/inventoryPhoto/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setInventory(currentInventory =>
        currentInventory.map(item => {
          if (item.id === itemId) {
            return { ...item, fotos: item.fotos.filter(p => p.id !== photoId) };
          }
          return item;
        })
      );
      toast.success('Foto excluída!', { id: loadingToast });
    } catch (error) {
      toast.error('Erro ao excluir foto.', { id: loadingToast });
    }
  };

  const handlePhotoUpload = async (files, itemId) => {
    const loadingToast = toast.loading(`Enviando ${files.length} foto(s)...`);
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('idItemInventario', itemId);
        return axios.post(`${API_URL}/inventoryPhoto/upload`, formData, { headers: { Authorization: `Bearer ${token}` } });
      });
      const responses = await Promise.all(uploadPromises);
      const newPhotos = responses.map(res => res.data.data);

      setInventory(currentInventory =>
        currentInventory.map(item => {
          if (item.id === itemId) {
            return { ...item, fotos: [...item.fotos, ...newPhotos] };
          }
          return item;
        })
      );
      toast.success('Fotos enviadas!', { id: loadingToast });
    } catch (error) {
      toast.error('Erro ao enviar fotos.', { id: loadingToast });
    }
  };

  if (!property) {
    return (<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div></div>);
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 md:ml-64">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">{ICON_MAP[property.tipo] ?? ICON_MAP['Outros']}{property.nomePropriedade}</h1>
              <p className="text-gray-500 mt-1">{property.enderecoLogradouro}, {property.enderecoCidade}</p>
            </div>
            <div className="space-x-3 flex items-center">
              <ActionButton icon={<DollarSign size={16} />} text="Financeiro" />
              <ActionButton icon={<Calendar size={16} />} text="Agenda" />
              <ActionButton
                icon={<Users size={16} />}
                text="Cotistas"
                onClick={() => navigate(paths.gerenciarMembros.replace(':id', propertyId))}
              />
            </div>
          </div>

          {property.fotos?.length > 0 ? (
            <div className="mb-8 bg-white rounded-2xl shadow-md overflow-hidden max-w-3xl mx-auto">
              <div className="relative pt-[56.25%] w-full">
                <img src={`${API_BASE_URL}${property.fotos[activeImage].documento}`} alt={`Foto ${activeImage + 1}`} className="absolute top-0 left-0 w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {property.fotos.map((_, index) => (<button key={index} onClick={() => setActiveImage(index)} className={`w-3 h-3 rounded-full transition-all ${activeImage === index ? 'bg-gold w-6' : 'bg-white bg-opacity-50'}`} />))}
                </div>
              </div>
              {isOwnerMaster && (
                <div className="p-4 flex justify-center gap-4 border-t">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2" onClick={() => setEditingProperty(!editingProperty)}>
                    <Pencil size={16} />{editingProperty ? 'Cancelar Edição' : 'Editar Propriedade'}
                  </button>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2" onClick={() => setShowDeletePropertyDialog(true)}>
                    <Trash2 size={16} /> Excluir Propriedade
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 bg-white rounded-2xl shadow-md p-12 flex flex-col items-center justify-center text-gray-400 h-64">
              <ImageIcon size={48} className="mb-4" />
              <p>Nenhuma foto disponível para esta propriedade</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Detalhes da Propriedade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
              {editingProperty ? (
                <>
                  <PropertyFormSection title="Informações Básicas" fields={[{ name: 'nomePropriedade', label: 'Nome', type: 'text' }, { name: 'tipo', label: 'Tipo', type: 'select', options: ['Casa', 'Apartamento', 'Chácara', 'Lote', 'Outros'] }, { name: 'valorEstimado', label: 'Valor estimado', type: 'number' }]} formData={propertyFormData} onChange={handlePropertyFormChange} />
                  <PropertyFormSection title="Endereço" fields={[{ name: 'enderecoLogradouro', label: 'Logradouro', type: 'text' }, { name: 'enderecoNumero', label: 'Número', type: 'text' }, { name: 'enderecoBairro', label: 'Bairro', type: 'text' }, { name: 'enderecoCidade', label: 'Cidade', type: 'text' }, { name: 'enderecoCep', label: 'CEP', type: 'text' }, { name: 'enderecoComplemento', label: 'Complemento', type: 'text' }, { name: 'enderecoPontoReferencia', label: 'Ponto de Referência', type: 'text' }]} formData={propertyFormData} onChange={handlePropertyFormChange} />
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <DetailItem label="Tipo" value={property.tipo} />
                    <DetailItem label="Valor estimado" value={`R$ ${Number(property.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <DetailItem label="Responsável" value={property.usuarios?.[0]?.usuario.nomeCompleto ?? 'Não informado'} />
                  </div>
                  <div className="space-y-4">
                    <DetailItem label="Endereço Completo" value={`${property.enderecoLogradouro}, ${property.enderecoNumero}\n${property.enderecoBairro}, ${property.enderecoCidade}\nCEP: ${property.enderecoCep}`} />
                    <DetailItem label="Complemento" value={property.enderecoComplemento || 'Não informado'} />
                    <DetailItem label="Ponto de Referência" value={property.enderecoPontoReferencia || 'Não informado'} />
                  </div>
                </>
              )}
            </div>
            {editingProperty && (<div className="mt-8 text-right"><button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 ml-auto text-lg" onClick={handleUpdateProperty}>Salvar Alterações</button></div>)}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-2xl font-semibold text-gray-800">Inventário da Propriedade</h2>
              {isOwnerMaster && (<button onClick={() => handleOpenInventoryModal(null)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"><PlusCircle size={18} />Adicionar Item</button>)}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>{isOwnerMaster && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}</tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.length > 0 ? (inventory.map(item => (<tr key={item.id}><td className="px-4 py-3"><div className="flex items-center cursor-pointer" onClick={() => setGalleryItem(item)}>{item.fotos && item.fotos.length > 0 ? (<img src={`${API_BASE_URL}${item.fotos[0].url}`} alt={item.nome} className="h-10 w-10 rounded-md object-cover" />) : (<div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>)}{item.fotos && item.fotos.length > 1 && (<span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">+{item.fotos.length - 1}</span>)}</div></td><td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td><td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={item.descricao}>{item.descricao || '-'}</td><td className="px-4 py-3 text-gray-600">{item.quantidade}</td><td className="px-4 py-3 text-gray-600">{item.estadoConservacao}</td>{isOwnerMaster && <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleOpenInventoryModal(item)} className="text-indigo-600 hover:text-indigo-900 font-medium">Editar</button><button onClick={() => handleOpenDeleteItemDialog(item)} className="text-red-600 hover:text-red-900 ml-4 font-medium">Excluir</button></td>}</tr>))) : (<tr><td colSpan={isOwnerMaster ? "6" : "5"} className="px-6 py-4 text-center text-gray-500">Nenhum item cadastrado no inventário.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Dialog isOpen={showDeletePropertyDialog} onClose={() => setShowDeletePropertyDialog(false)} title="Confirmar exclusão">
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-lg">Tem certeza que deseja excluir permanentemente a propriedade &quot;{property.nomePropriedade}&quot;? Esta ação não pode ser desfeita.</p>
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

      <InventoryModal isOpen={isInventoryModalOpen} onClose={handleCloseInventoryModal} formData={inventoryFormData} setFormData={setInventoryFormData} handleSubmit={handleSaveInventoryItem} itemToEdit={itemToEdit} onPhotoUpload={(files) => handlePhotoUpload(files, itemToEdit.id)} onPhotoDelete={(photoId) => handlePhotoDelete(photoId, itemToEdit.id)} />
      
      <InventoryGalleryModal isOpen={!!galleryItem} onClose={() => setGalleryItem(null)} photos={galleryItem?.fotos || []} />
    </>
  );
};

// --- Componentes Auxiliares ---

const ActionButton = ({ icon, text, onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-yellow-300 rounded-xl text-black hover:bg-yellow-400 transition flex items-center">
    {icon}
    <span className="ml-2">{text}</span>
  </button>
);
ActionButton.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

const PropertyFormSection = ({ title, fields, formData, onChange }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}:</label>
          {field.type === 'select' ? (<select name={field.name} value={formData[field.name] || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent">{field.options.map((option) => (<option key={option} value={option}>{option}</option>))}</select>) : (<input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />)}
        </div>
      ))}
    </div>
  </div>
);
PropertyFormSection.propTypes = { title: PropTypes.string.isRequired, fields: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired, label: PropTypes.string.isRequired, type: PropTypes.string.isRequired, options: PropTypes.arrayOf(PropTypes.string) })).isRequired, formData: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };

const DetailItem = ({ label, value }) => (<div><p className="font-medium text-gray-800">{label}:</p><p className="text-gray-600 whitespace-pre-wrap">{value}</p></div>);
DetailItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };

export default PropertyDetails;

