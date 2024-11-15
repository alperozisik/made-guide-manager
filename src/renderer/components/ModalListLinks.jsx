// src/renderer/components/ModalListLinks.jsx
import React, { useState, useMemo } from 'react';
import './ModalListLinks.css';

function ModalListLinks({ onClose, onSelect, links }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered links based on search term
  const filteredLinks = useMemo(() => {
    return links.filter((link) =>
      link.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [links, searchTerm]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-list-links" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>List of Links</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="table-container">
            <table className="links-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => (
                  <tr key={link.id} onClick={() => onSelect(link.id)}>
                    <td>{link.id}</td>
                    <td>{link.name}</td>
                  </tr>
                ))}
                {filteredLinks.length === 0 && (
                  <tr>
                    <td colSpan="2">No links found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalListLinks;