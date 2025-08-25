import React from 'react';
import PropTypes from 'prop-types';

export function Dialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fade-in-up">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
          onClick={onClose}
          aria-label="Fechar"
        >
          &times;
        </button>
        {title && (
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}

Dialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};
