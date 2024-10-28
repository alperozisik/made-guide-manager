// src/renderer/components/ModalInput.jsx

import React, { useState, useEffect } from 'react';
import './ModalNewLink.css'; // Don't forget to create the style file

function ModalNewLink({ onOK, onCancel }) {
  const [nameValue, setNameValue] = useState('');
  const [urlValue, setUrlValue] = useState('');

  // listen to keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        //handleOK();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nameValue]);

  const handleOK = () => {
    if (onOK) {
      onOK({ name: nameValue, url: urlValue, valid: true, certification: false, successor: null, topics: [], personas: [] });
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
        <h2 className="modal-title">New Link</h2>
        <div className="modal-message">Enter name and URL of the link. You will be editing other features of the link after it's creation.</div>
        <label className="modal-label">Name:
          <input
            type="text"
            className="modal-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            autoFocus
          />
        </label>
        <label className="modal-label">URL:
          <input
            type="text"
            className="modal-input"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
        </label>
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
export default ModalNewLink;
