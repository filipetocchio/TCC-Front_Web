// Todos direitos autorais reservados pelo QOTA.

/**
 * Biblioteca de Diálogos para a Seção de Inventário
 *
 * Descrição:
 * Este arquivo contém os componentes de diálogo (modais de confirmação) utilizados
 * na seção de inventário. A componentização desses diálogos melhora a
 * legibilidade e encapsula a lógica de UI para ações críticas, como a exclusão
 * de um item do inventário.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '../ui/dialog';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

/**
 * Diálogo de confirmação para a exclusão (soft delete) de um item do inventário.
 */
export const DeleteItemDialog = React.memo(({ isOpen, onClose, onConfirm, isSubmitting, itemName }) => (
  <Dialog isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão de Item">
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Você tem certeza?</h4>
          <p className="text-gray-600 text-sm">
            Esta ação marcará o item "{itemName}" como excluído. Ele não será
            removido permanentemente e poderá ser recuperado no futuro.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-200 rounded-md font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold flex justify-center items-center w-44 disabled:bg-gray-400"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : (
            <>
              <Trash2 size={16} className="mr-2" />
              Confirmar Exclusão
            </>
          )}
        </button>
      </div>
    </div>
  </Dialog>
));

DeleteItemDialog.displayName = 'DeleteItemDialog';

DeleteItemDialog.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
  /** Função a ser executada ao confirmar a exclusão. */
  onConfirm: PropTypes.func.isRequired,
  /** Indica se a ação de exclusão está em andamento. */
  isSubmitting: PropTypes.bool.isRequired,
  /** O nome do item a ser exibido na mensagem de confirmação. */
  itemName: PropTypes.string,
};