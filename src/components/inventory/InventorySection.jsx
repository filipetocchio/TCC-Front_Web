// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente da Seção de Inventário
 *
 * Descrição:
 * Este arquivo define o componente que gerencia e exibe o inventário de uma
 * propriedade. Ele encapsula toda a lógica de negócio, estado e UI relacionados
 * ao inventário, incluindo a exibição da lista de itens, a abertura de modais
 * para criação/edição e a execução das ações de CRUD (Criar, Ler, Atualizar, Excluir).
 *
 * Funcionalidades:
 * - Exibe a lista de itens do inventário em uma tabela.
 * - Controla a visibilidade e o estado dos modais para adicionar/editar itens,
 * ver a galeria de fotos e confirmar exclusões.
 * - Gerencia o estado do formulário do inventário.
 * - Lida com as chamadas à API para todas as operações de inventário.
 * - Fornece feedback visual de carregamento durante as operações de API.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import InventoryModal from './InventoryModal';
import InventoryGalleryModal from './InventoryGalleryModal';
import { DeleteItemDialog } from './InventoryDialogs';
import { PlusCircle, ImageIcon, Pencil, Trash2 } from 'lucide-react';

// Constante para a URL base da API, usada para construir caminhos de imagens.
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

/**
 * Componente que renderiza a tabela do inventário.
 */
const InventoryTable = React.memo(({ inventory, permissions, onEdit, onDelete, onOpenGallery }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
          {permissions.isMember && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {inventory.length > 0 ? (
          inventory.map(item => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="flex items-center cursor-pointer" onClick={() => onOpenGallery(item)}>
                  {item.fotos && item.fotos.length > 0 ? (
                    <img src={`${API_BASE_URL}${item.fotos[0].url}`} alt={item.nome} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
                  )}
                  {item.fotos && item.fotos.length > 1 && (
                    <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">+{item.fotos.length - 1}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
              <td className="px-4 py-3 text-gray-600">{item.quantidade}</td>
              <td className="px-4 py-3 text-gray-600">{item.estadoConservacao}</td>
              {permissions.isMember && (
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  {permissions.isMaster ? (
                    <>
                      <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900 font-medium"><Pencil size={16} /></button>
                      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-900 ml-4 font-medium"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={permissions.isMember ? "5" : "4"} className="px-6 py-4 text-center text-gray-500">Nenhum item cadastrado.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
));
InventoryTable.displayName = 'InventoryTable';
InventoryTable.propTypes = {
  inventory: PropTypes.array.isRequired,
  permissions: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onOpenGallery: PropTypes.func.isRequired,
};

/**
 * Componente principal da seção de inventário.
 */
export const InventorySection = ({ inventory, permissions, onDataChange }) => {
  // --- Gerenciamento de Estado para Modais e Ações ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Manipuladores de Eventos (Otimizados) ---
  const handleOpenModal = useCallback(async (item = null) => {
    if (item) {
      const loadingToast = toast.loading("Carregando dados do item...");
      try {
        const response = await api.get(`/inventory/${item.id}`);
        setItemToEdit(response.data.data);
        setIsModalOpen(true);
        toast.dismiss(loadingToast);
      } catch (error) {
        toast.error("Não foi possível carregar os dados do item.", { id: loadingToast });
      }
    } else {
      setItemToEdit(null);
      setIsModalOpen(true);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setItemToEdit(null);
    onDataChange(); // Recarrega os dados da página principal
  }, [onDataChange]);

  const handleOpenDeleteItemDialog = useCallback((item) => {
    setItemToDelete(item);
    setShowDeleteItemDialog(true);
  }, []);

  const handleConfirmDeleteItem = useCallback(async () => {
    if (!itemToDelete || isSubmitting) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Excluindo item...');
    try {
      await api.delete(`/inventory/${itemToDelete.id}`);
      toast.success('Item excluído com sucesso.', { id: loadingToast });
      onDataChange();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao excluir o item.', { id: loadingToast });
    } finally {
      setShowDeleteItemDialog(false);
      setItemToDelete(null);
      setIsSubmitting(false);
    }
  }, [itemToDelete, onDataChange, isSubmitting]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-8 mt-8">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h2 className="text-2xl font-semibold text-gray-800">Inventário</h2>
          {permissions.isMember && (
            <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
              <PlusCircle size={18} />Adicionar Item
            </button>
          )}
        </div>
        <InventoryTable
            inventory={inventory}
            permissions={permissions}
            onEdit={handleOpenModal}
            onDelete={handleOpenDeleteItemDialog}
            onOpenGallery={setGalleryItem}
        />
      </div>

      {/* Modais Gerenciados por esta Seção */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        itemToEdit={itemToEdit}
        propertyId={permissions.idPropriedade} // Passa o ID da propriedade para o modal
        isMaster={permissions.isMaster}
      />
      <InventoryGalleryModal
        isOpen={!!galleryItem}
        onClose={() => setGalleryItem(null)}
        photos={galleryItem?.fotos || []}
        apiBaseUrl={API_BASE_URL}
      />
      <DeleteItemDialog
        isOpen={showDeleteItemDialog}
        onClose={() => setShowDeleteItemDialog(false)}
        onConfirm={handleConfirmDeleteItem}
        itemName={itemToDelete?.nome}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
InventorySection.propTypes = {
  inventory: PropTypes.array.isRequired,
  permissions: PropTypes.object.isRequired,
  onDataChange: PropTypes.func.isRequired,
};