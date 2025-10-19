// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente de Diálogo (Modal)
 *
 * Descrição:
 * Este arquivo define um componente de diálogo genérico e reutilizável, projetado para
 * exibir conteúdo modal, como alertas de confirmação ou formulários complexos.
 *
 * Funcionalidades:
 * - Renderiza o conteúdo sobre um overlay que escurece o fundo da página.
 * - É acessível e segue as melhores práticas de UX, permitindo o fechamento através
 * do botão 'X', da tecla 'Escape' ou clicando no overlay.
 * - Otimizado com `React.memo` para prevenir re-renderizações desnecessárias.
 */
import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import clsx from 'clsx'; 

const Dialog = React.memo(({ isOpen, onClose, title, children, width = 'max-w-lg' }) => {
  /**
   * Efeito para adicionar e remover um event listener para a tecla 'Escape'.
   * Permite que o usuário feche o diálogo pressionando a tecla Esc.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Função de limpeza: remove o event listener quando o componente é desmontado
    // ou quando o diálogo é fechado, para evitar vazamentos de memória.
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /**
   * Manipula o clique no container do overlay.
   * Fecha o diálogo apenas se o clique for no próprio overlay (o fundo escuro)
   * e não no conteúdo do diálogo.
   */
  const handleOverlayClick = useCallback((e) => {
    // e.target se refere ao elemento clicado, e.currentTarget ao elemento com o listener.
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Não renderiza nada se o diálogo não estiver aberto.
  if (!isOpen) return null;
  
  return (
    // O container principal com o overlay.
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* O corpo do diálogo. O 'onClick' impede que cliques dentro dele fechem o modal. */}
      <div 
        className={clsx(
          "bg-white rounded-2xl shadow-2xl w-full text-black m-4",
          width // Aplica a classe de largura, ex: 'max-w-lg', 'max-w-3xl'
        )} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Diálogo */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="dialog-title" className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Conteúdo dinâmico do diálogo */}
        {children}
      </div>
    </div>
  );
});

// Adiciona um nome de exibição para facilitar a depuração no React DevTools.
Dialog.displayName = 'Dialog';

// Definição das propriedades esperadas pelo componente.
Dialog.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal, acionada por múltiplos eventos. */
  onClose: PropTypes.func.isRequired,
  /** O título exibido no cabeçalho do diálogo. */
  title: PropTypes.string.isRequired,
  /** O conteúdo a ser renderizado dentro do diálogo (pode ser qualquer elemento React). */
  children: PropTypes.node.isRequired,
  /** Define a classe de largura máxima do modal (padrão Tailwind CSS). */
  width: PropTypes.string,
};

export default Dialog;