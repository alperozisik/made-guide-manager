// src/renderer/components/ModalInput.jsx

import React, { useState, useEffect } from 'react';
import './ModalInput.css'; // Stil dosyasını oluşturmayı unutmayın

function ModalInput({ title, message, suggestion, onOK, onCancel }) {
  const [inputValue, setInputValue] = useState(suggestion || '');

  // Klavye olaylarını dinleme
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleOK();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Temizleme
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputValue]);

  const handleOK = () => {
    if (onOK) {
      onOK(inputValue);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="modalInput-overlay">
      <div className="modal-content">
        {title && <h2 className="modal-title">{title}</h2>}
        {message && <div className="modal-message">{message}</div>}
        <input
          type="text"
          className="modal-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={suggestion}
          autoFocus
        />
        <div className="modal-buttons">
          <button className="modal-button ok-button" onClick={handleOK}>
            OK
          </button>
          <button className="modal-button cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalInput;
