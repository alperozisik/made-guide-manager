// src/renderer/components/Modal.jsx

import React from 'react';
import './Modal.css'; // Stil dosyasını eklemeyi unutmayın

function Modal({ isOpen, onClose, text, buttons }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-text">{text}</p>
        <div className="modal-buttons">
          {buttons && buttons.map((button, index) => (
            <button
              key={index}
              className="modal-button"
              onClick={() => {
                if (button.action) button.action();
                if (button.closeOnClick !== false) onClose();
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Modal;
