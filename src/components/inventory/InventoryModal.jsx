import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, UploadCloud, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
// Todos direitos autorais reservados pelo QOTA.

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1').replace('/api/v1', '');

const InventoryModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  itemToEdit,
  onPhotoUpload,
  onPhotoDelete
}) => {
  const [existingPhotos, setExistingPhotos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({ ...itemToEdit, photoFiles: [] });
        setExistingPhotos(itemToEdit.fotos || []);
      } else {
        setFormData({ nome: '', quantidade: 1, estadoConservacao: 'BOM', categoria: '', descricao: '', photoFiles: [] });
        setExistingPhotos([]);
      }
    }
  }, [itemToEdit, isOpen, setFormData]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // Converte o valor para número se o input for do tipo 'number'.
    // Se o campo estiver vazio, mantém uma string vazia para o usuário poder apagar.
    // Ao submeter, a validação ou conversão final ocorrerá.
    const processedValue = type === 'number' && value !== '' ? parseInt(value, 10) : value;

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  // =======================================================================
  
  const handleFileChange = (e) => {
    if (e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    const totalPhotos = (formData.photoFiles?.length || 0) + existingPhotos.length + newFiles.length;

    if (totalPhotos > 6) {
      toast.error('Você só pode ter no máximo 6 fotos por item.');
      return;
    }
    
    if (itemToEdit) {
      onPhotoUpload(newFiles);
    } else {
      setFormData(prev => ({ ...prev, photoFiles: [...(prev.photoFiles || []), ...newFiles] }));
    }
  };

  const removeNewFile = (index) => {
    setFormData(prev => ({ ...prev, photoFiles: prev.photoFiles.filter((_, i) => i !== index) }));
  };

  const modalTitle = itemToEdit ? 'Editar Item do Inventário' : 'Adicionar Item ao Inventário';
  const totalPhotosCount = (formData.photoFiles?.length || 0) + existingPhotos.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl text-black max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Item *</label>
            <input type="text" name="nome" value={formData.nome || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
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
            <textarea name="descricao" value={formData.descricao || ''} onChange={handleInputChange} rows="3" placeholder="Ex: Modelo, cor, voltagem, ou qualquer observação." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos ({totalPhotosCount} de 6)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
              {existingPhotos.map(photo => (
                <div key={`existing-${photo.id}`} className="relative group aspect-square">
                  <img src={`${API_BASE_URL}${photo.url}`} alt="Item" className="w-full h-full object-cover rounded-md" />
                  <button type="button" onClick={() => onPhotoDelete(photo.id)} className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {formData.photoFiles?.map((file, index) => (
                <div key={`new-${index}`} className="relative group aspect-square">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded-md" />
                  <button type="button" onClick={() => removeNewFile(index)} className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {totalPhotosCount < 6 && (
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-500 transition-colors">
                <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Adicionar fotos</p>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition font-semibold">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

InventoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
  onPhotoUpload: PropTypes.func.isRequired,
  onPhotoDelete: PropTypes.func.isRequired,
};

export default InventoryModal;