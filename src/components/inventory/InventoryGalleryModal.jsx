// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente InventoryGalleryModal
 *
 * Descrição:
 * Este arquivo define um componente de modal de galeria (lightbox) reutilizável,
 * projetado para exibir as fotos de um item do inventário em tela cheia.
 *
 * Funcionalidades:
 * - Exibe uma imagem de cada vez sobre um overlay escuro.
 * - Suporta navegação entre as imagens através de botões na tela (anterior/próximo).
 * - Suporta navegação por teclado (setas Esquerda/Direita para navegar, Esc para fechar).
 * - Exibe um contador de imagens (ex: "2 / 5").
 * - Otimizado com `React.memo` e `useCallback` para melhor performance.
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Define a URL base da API para construir os caminhos das imagens.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1').replace('/api/v1', '');

const InventoryGalleryModal = React.memo(({ isOpen, onClose, photos, apiBaseUrl = API_BASE_URL }) => {
  // --- Gerenciamento de Estado ---
  // Estado para controlar o índice da foto sendo exibida atualmente.
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Navega para a imagem anterior no carrossel.
   * A lógica é circular, voltando para a última imagem se estiver na primeira.
   */
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? photos.length - 1 : prevIndex - 1));
  }, [photos.length]);

  /**
   * Navega para a próxima imagem no carrossel.
   * A lógica é circular, voltando para a primeira imagem se estiver na última.
   */
  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === photos.length - 1 ? 0 : prevIndex + 1));
  }, [photos.length]);

  /**
   * Efeito para resetar o índice para a primeira foto sempre que o modal for aberto.
   */
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  /**
   * Efeito para adicionar e remover listeners de eventos de teclado.
   * Permite a navegação na galeria usando as setas do teclado e o fechamento com 'Escape'.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      if (event.key === 'ArrowLeft') goToPrevious();
      if (event.key === 'ArrowRight') goToNext();
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Função de limpeza para remover o listener e evitar vazamentos de memória.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Não renderiza nada se o modal não estiver aberto ou não houver fotos.
  if (!isOpen || !photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="relative bg-transparent p-4 w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        
        {/* Botão de Fechar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-20" aria-label="Fechar galeria">
          <X size={32} />
        </button>

        {/* Botão Anterior */}
        {photos.length > 1 && (
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-20" aria-label="Foto anterior">
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Imagem Principal */}
        <div className="relative max-w-4xl max-h-[85vh]">
          <img
            src={`${apiBaseUrl}${photos[currentIndex].url}`}
            alt={`Foto ${currentIndex + 1} do item`}
            className="object-contain w-full h-full max-h-[85vh]"
          />
        </div>

        {/* Botão Próximo */}
        {photos.length > 1 && (
          <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-20" aria-label="Próxima foto">
            <ChevronRight size={28} />
          </button>
        )}
        
        {/* Contador de Imagens */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
});

InventoryGalleryModal.displayName = 'InventoryGalleryModal';

InventoryGalleryModal.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
  /** Array de objetos de foto, cada um contendo 'id' e 'url'. */
  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    url: PropTypes.string,
  })).isRequired,
  /** URL base da API para construir o caminho completo das imagens. */
  apiBaseUrl: PropTypes.string,
};

export default InventoryGalleryModal;