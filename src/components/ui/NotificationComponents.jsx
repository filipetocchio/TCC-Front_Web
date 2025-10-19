// Todos direitos autorais reservados pelo QOTA.

/**
 * Biblioteca de Componentes de Notificação
 *
 * Descrição:
 * Este arquivo contém componentes de UI reutilizáveis relacionados ao sistema de
 * notificações da plataforma. A componentização desses elementos promove a
 * consistência visual e encapsula a lógica de apresentação das notificações.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from './dialog';
import { Bell } from 'lucide-react';

/**
 * Exibe o ícone de sino de notificação com um badge indicando o número de
 * notificações não lidas.
 */
export const NotificationBell = React.memo(({ unreadCount, onClick }) => (
  <button onClick={onClick} className="relative p-2 text-gray-600 hover:text-black transition-colors" aria-label="Abrir notificações">
    <Bell size={24} />
    {unreadCount > 0 && (
      <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-gray-50">
        {unreadCount}
      </span>
    )}
  </button>
));
NotificationBell.displayName = 'NotificationBell';
NotificationBell.propTypes = {
  /** O número de notificações não lidas a ser exibido no badge. */
  unreadCount: PropTypes.number.isRequired,
  /** A função a ser executada quando o sino é clicado. */
  onClick: PropTypes.func.isRequired,
};

/**
 * Exibe um modal (diálogo) com a lista de notificações de uma propriedade.
 */
export const NotificationModal = React.memo(({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;
  
  // Garante que a lista de notificações seja sempre um array, mesmo que a prop seja nula.
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
});
NotificationModal.displayName = 'NotificationModal';
NotificationModal.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
  /** Array contendo os objetos de notificação a serem exibidos. */
  notifications: PropTypes.array.isRequired,
};