/**
 * @file InventoryGalleryModal.jsx
 * @description Componente de lightbox/galeria para exibir as fotos de um item do inventário em tela cheia.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1').replace('/api/v1', '');

const InventoryGalleryModal = ({ isOpen, onClose, photos }) => {
  // Estado para controlar qual foto está sendo exibida atualmente
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reseta o índice para a primeira foto sempre que o modal for aberto com um novo conjunto de fotos
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !photos || photos.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? photos.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex === photos.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="relative bg-transparent p-4 w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Botão de Fechar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-20">
          <X size={32} />
        </button>

        {/* Botão Anterior */}
        {photos.length > 1 && (
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-20">
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Imagem Principal */}
        <div className="relative max-w-4xl max-h-[85vh]">
          <img
            src={`${API_BASE_URL}${photos[currentIndex].url}`}
            alt={`Foto ${currentIndex + 1}`}
            className="object-contain w-full h-full max-h-[85vh]"
          />
        </div>

        {/* Botão Próximo */}
        {photos.length > 1 && (
          <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-20">
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
};

InventoryGalleryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    url: PropTypes.string,
  })).isRequired,
};

export default InventoryGalleryModal;