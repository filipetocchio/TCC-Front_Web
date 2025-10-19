// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente InventoryModal
 *
 * Descrição:
 * Este arquivo define um modal completo para a criação e edição de itens de
 * inventário. O componente é autônomo, gerenciando seu próprio estado de formulário,
 * lógica de submissão, upload de fotos e tratamento de erros.
 *
 * Funcionalidades:
 * - Opera em dois modos: 'criação' ou 'edição', com base na prop `itemToEdit`.
 * - Gerencia o upload de novas fotos e a exclusão de fotos existentes.
 * - Valida o número máximo de fotos por item.
 * - Fornece feedback visual de carregamento (`isSubmitting`) durante as operações de API.
 * - Otimizado com `useCallback` para melhor performance.
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Dialog from '../ui/dialog';
import { FileInput, FilePreview } from '../ui/FormComponents';
import { Trash2, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

const getInitialState = (propertyId) => ({
  idPropriedade: propertyId,
  nome: '',
  quantidade: 1,
  estadoConservacao: 'BOM',
  categoria: '',
  descricao: '',
  fotos: [],
  photoFiles: [],
});

const InventoryModal = ({ isOpen, onClose, itemToEdit, propertyId, isMaster }) => {
  const [formData, setFormData] = useState(getInitialState(propertyId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({ ...itemToEdit, photoFiles: [] });
      } else {
        setFormData(getInitialState(propertyId));
      }
    }
  }, [itemToEdit, isOpen, propertyId]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' && value !== '' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const imageFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== e.target.files.length) {
      toast.error('Apenas arquivos de imagem são permitidos.');
    }
    const totalPhotos = (formData.fotos?.length || 0) + (formData.photoFiles?.length || 0) + imageFiles.length;
    if (totalPhotos > 6) {
      toast.error('Você pode ter no máximo 6 fotos por item.');
      return;
    }
    setFormData(prev => ({ ...prev, photoFiles: [...(prev.photoFiles || []), ...imageFiles] }));
  }, [formData.fotos, formData.photoFiles]);

  const removeNewFile = useCallback((index) => {
    setFormData(prev => ({ ...prev, photoFiles: prev.photoFiles.filter((_, i) => i !== index) }));
  }, []);

  const handlePhotoDelete = useCallback(async (photoId) => {
    if (!isMaster) {
        toast.error("Apenas proprietários master podem excluir fotos.");
        return;
    }
    const loadingToast = toast.loading('Excluindo foto...');
    try {
      await api.delete(`/inventoryPhoto/${photoId}`);
      setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== photoId) }));
      toast.success('Foto excluída com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível excluir a foto.', { id: loadingToast });
    }
  }, [isMaster]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const isEditing = !!itemToEdit;
    const loadingToast = toast.loading(isEditing ? 'Atualizando item...' : 'Adicionando item...');
    
    try {
      const { photoFiles, fotos, ...itemData } = formData;
      let targetItemId = itemToEdit?.id;

      if (isEditing) {
        if (isMaster) {
          await api.put(`/inventory/${itemToEdit.id}`, itemData);
        } else {
            toast.error("Apenas proprietários master podem editar itens.");
            throw new Error("Permissão negada");
        }
      } else {
        const response = await api.post('/inventory/create', itemData);
        targetItemId = response.data.data.id;
      }

      if (photoFiles && photoFiles.length > 0) {
        toast.loading('Enviando fotos...', { id: loadingToast });
        const uploadPromises = photoFiles.map(file => {
          const photoFormData = new FormData();
          photoFormData.append('photo', file);
          photoFormData.append('idItemInventario', targetItemId);
          return api.post('/inventoryPhoto/upload', photoFormData);
        });
        await Promise.all(uploadPromises);
      }

      toast.success(isEditing ? 'Item atualizado!' : 'Item adicionado!', { id: loadingToast });
      onClose();
    } catch (err) {
      // Evita exibir o toast de erro se a mensagem for de permissão negada
      if (err.message !== "Permissão negada") {
        toast.error(err.response?.data?.message || 'Ocorreu um erro ao salvar o item.', { id: loadingToast });
      } else {
        toast.dismiss(loadingToast);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, itemToEdit, onClose, isSubmitting, isMaster]);

  const modalTitle = itemToEdit ? 'Editar Item do Inventário' : 'Adicionar Item ao Inventário';
  const totalPhotosCount = (formData.fotos?.length || 0) + (formData.photoFiles?.length || 0);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do Item *</label>
          <input type="text" name="nome" value={formData.nome || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade *</label>
            <input type="number" name="quantidade" value={formData.quantidade || 1} onChange={handleInputChange} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado de Conservação *</label>
            <select name="estadoConservacao" value={formData.estadoConservacao || 'BOM'} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="BOM">Bom</option><option value="NOVO">Novo</option><option value="DESGASTADO">Desgastado</option><option value="DANIFICADO">Danificado</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <input type="text" name="categoria" value={formData.categoria || ''} onChange={handleInputChange} placeholder="Ex: Cozinha, Eletrônicos..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
          <textarea name="descricao" value={formData.descricao || ''} onChange={handleInputChange} rows="3" placeholder="Ex: Modelo, cor, voltagem..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fotos ({totalPhotosCount} de 6)</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
            {formData.fotos?.map(photo => (
              <FilePreview key={`existing-${photo.id}`} isImage imageUrl={`${API_BASE_URL}${photo.url}`} onRemove={() => handlePhotoDelete(photo.id)} file={{name: `Foto ${photo.id}`}}/>
            ))}
            {formData.photoFiles?.map((file, index) => (
              <FilePreview key={`new-${index}`} file={file} isImage onRemove={() => removeNewFile(index)} />
            ))}
          </div>
          {totalPhotosCount < 6 && (
            <FileInput name="photoFiles" onChange={handleFileChange} multiple accept="image/*" />
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition font-semibold flex justify-center items-center w-28 disabled:bg-gray-400">
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

InventoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
  propertyId: PropTypes.number,
  isMaster: PropTypes.bool.isRequired,
};

export default InventoryModal;