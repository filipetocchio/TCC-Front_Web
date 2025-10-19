// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Detalhes da Propriedade
 *
 * Descrição:
 * Este arquivo define a página principal de gerenciamento de uma propriedade. Ele atua
 * como um "hub" central que orquestra a exibição de dados, a interação com
 * múltiplos modais e a execução de todas as ações relacionadas à propriedade
 * (edição, exclusão, gerenciamento de inventário, etc.).
 *
 */
import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import Sidebar from '../components/layout/Sidebar';
import { PropertyHeader, PropertyGallery, PropertyDetailsSection, PropertyActions } from '../components/property/PropertySections';
import { InventorySection } from '../components/inventory/InventorySection';
import { UnlinkDialog, DeletePropertyDialog } from '../components/property/PropertyDialogs';
import { NotificationBell, NotificationModal } from '../components/ui/NotificationComponents';
import InventoryModal from '../components/inventory/InventoryModal';
import InventoryGalleryModal from '../components/inventory/InventoryGalleryModal';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';

// Constante para a URL base da API, usada para construir caminhos de imagens.
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api/v1', '');

const PropertyDetails = () => {
  // --- Hooks e Estado Principal ---
  const { id: propertyId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Busca todos os dados necessários para a página em paralelo.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyResponse, inventoryResponse, notificationsResponse] = await Promise.all([
        api.get(`/property/${propertyId}`),
        api.get(`/inventory/property/${propertyId}`),
        api.get(`/notification/property/${propertyId}`),
      ]);
      setProperty(propertyResponse.data.data);
      setInventory(inventoryResponse.data.data);
      setNotifications(notificationsResponse.data.data || []);
    } catch (error) {
      toast.error('Não foi possível carregar os dados da propriedade.');
      navigate(paths.home); // Redireciona em caso de erro (ex: falta de permissão)
    } finally {
      setLoading(false);
    }
  }, [propertyId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Memoriza os dados de permissão do usuário para otimizar a renderização.
   */
  const currentUserPermissions = useMemo(() => {
    if (!property || !usuario) return { isMember: false, isMaster: false, vinculoId: null };
    const userLink = property.usuarios.find(m => m.usuario?.id === usuario.id);
    if (!userLink) return { isMember: false, isMaster: false, vinculoId: null };
    return {
      isMember: true,
      isMaster: userLink.permissao === 'proprietario_master',
      numeroDeFracoes: userLink.numeroDeFracoes,
      saldoDiarias: userLink.saldoDiariasAtual,
      vinculoId: userLink.id,
    };
  }, [property, usuario]);

  /**
   * Filtra as notificações não lidas pelo usuário atual.
   */
  const unreadNotifications = useMemo(() => {
    if (!usuario || !notifications) return [];
    return notifications.filter(n => !n.lidaPor.some(userWhoRead => userWhoRead.id === usuario.id));
  }, [notifications, usuario]);

  /**
   * Manipula o fechamento do modal de notificações e marca as não lidas como lidas.
   */
  const handleCloseNotificationModal = useCallback(async () => {
    setIsNotificationModalOpen(false);
    const unreadIds = unreadNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      try {
        await api.put('/notification/read', { notificationIds: unreadIds });
        // Atualiza o estado local para uma resposta visual instantânea.
        setNotifications(current => 
          current.map(n => 
            unreadIds.includes(n.id) ? { ...n, lidaPor: [...n.lidaPor, { id: usuario.id }] } : n
          )
        );
      } catch (error) {
        toast.error("Não foi possível marcar as notificações como lidas.");
      }
    }
  }, [unreadNotifications, usuario?.id]);

  /**
   * Permite que um usuário se desvincule da propriedade.
   */
  const handleUnlink = useCallback(async () => {
    if (!currentUserPermissions.vinculoId) return;
    const loadingToast = toast.loading('Desvinculando da propriedade...');
    try {
      await api.delete(`/permission/unlink/me/${currentUserPermissions.vinculoId}`);
      toast.success('Você foi desvinculado com sucesso.', { id: loadingToast });
      navigate(paths.home);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível se desvincular.', { id: loadingToast });
    } finally {
      setShowUnlinkDialog(false);
    }
  }, [currentUserPermissions.vinculoId, navigate]);

// --- Renderização ---
  if (loading || !property) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64', "flex items-center justify-center")}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
          
          <PropertyHeader
            property={property}
            permissions={currentUserPermissions}
            onNotificationClick={() => setIsNotificationModalOpen(true)}
            unreadCount={unreadNotifications.length}
          />

          <PropertyGallery photos={property.fotos} apiBaseUrl={API_BASE_URL} />
          
          {/* O PropertyDetailsSection contém os botões de ação e gerencia a lógica de edição. */}
          <PropertyDetailsSection
            property={property}
            permissions={currentUserPermissions}
            onDataChange={fetchData}
            onUnlink={() => setShowUnlinkDialog(true)}
          />

          <InventorySection
            inventory={inventory}
            permissions={{...currentUserPermissions, idPropriedade: Number(propertyId)}}
            onDataChange={fetchData}
          />
        </main>
      </div>

      {/* Modais Gerenciados pela Página Principal */}
      <NotificationModal isOpen={isNotificationModalOpen} onClose={handleCloseNotificationModal} notifications={notifications} />
      <UnlinkDialog
        isOpen={showUnlinkDialog}
        onClose={() => setShowUnlinkDialog(false)}
        onConfirm={handleUnlink}
        isSubmitting={false} 
      />
    </>
  );
};

export default PropertyDetails;