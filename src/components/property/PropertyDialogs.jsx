// Todos direitos autorais reservados pelo QOTA.

/**
 * Biblioteca de Diálogos para a Página de Propriedade
 *
 * Descrição:
 * Este arquivo contém os componentes de diálogo (modais de confirmação) utilizados
 * na página de detalhes da propriedade.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '../ui/dialog';
import { AlertTriangle, LogOut, Trash2, Loader2 } from 'lucide-react';

/**
 * Diálogo de confirmação para a desvinculação de um usuário de uma propriedade.
 */
export const UnlinkDialog = React.memo(({ isOpen, onClose, onConfirm, isSubmitting }) => (
  <Dialog isOpen={isOpen} onClose={onClose} title="Confirmar Desvinculação">
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Você tem certeza?</h4>
          <p className="text-gray-600 text-sm">
            Ao se desvincular, sua participação (frações) na propriedade será transferida
            de acordo com as regras estabelecidas, e você perderá o acesso.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
        <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 rounded-md font-semibold disabled:opacity-50">Cancelar</button>
        <button onClick={onConfirm} disabled={isSubmitting} className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold flex justify-center items-center w-36 disabled:bg-gray-400">
          {isSubmitting ? <Loader2 className="animate-spin" /> : (
            <>
              <LogOut size={16} className="mr-2" />
              Confirmar
            </>
          )}
        </button>
      </div>
    </div>
  </Dialog>
));
UnlinkDialog.displayName = 'UnlinkDialog';
UnlinkDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};

/**
 * Diálogo de confirmação para a exclusão (soft delete) de uma propriedade.
 */
export const DeletePropertyDialog = React.memo(({ isOpen, onClose, onConfirm, isSubmitting, propertyName }) => (
  <Dialog isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão de Propriedade">
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Ação Irreversível</h4>
          <p className="text-gray-600 text-sm">
            Tem certeza que deseja excluir a propriedade "{propertyName}"? Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
        <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 rounded-md font-semibold disabled:opacity-50">Cancelar</button>
        <button onClick={onConfirm} disabled={isSubmitting} className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold flex justify-center items-center w-44 disabled:bg-gray-400">
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
DeletePropertyDialog.displayName = 'DeletePropertyDialog';
DeletePropertyDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  propertyName: PropTypes.string,
};