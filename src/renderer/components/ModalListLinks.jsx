// src/renderer/components/ModalListLinks.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './ModalListLinks.css';

function ModalListLinks({ onClose, onSelect, links, showInvalidLinks, onShowInvalidLinksChange }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState('id'); // Default sort column is 'id'
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

    // Reference to the search input element
    const searchInputRef = useRef(null);

    // Focus the search input when the modal opens
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Handle keydown events to close modal on ESC key press
    useEffect(() => {
        // Function to handle keydown events
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Add event listener to the document
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup event listener on component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Function to handle sorting
    const handleSort = (column) => {
        if (sortColumn === column) {
            // Toggle sort direction if same column is clicked
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort column and default to ascending order
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Filtered and sorted links based on search term and sorting
    const filteredLinks = useMemo(() => {
        // Apply search filter
        let result = links.filter((link) =>
            link.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply sorting
        result.sort((a, b) => {
            let compare = 0;
            if (sortColumn === 'id') {
                compare = a.id - b.id;
            } else if (sortColumn === 'name') {
                compare = a.name.localeCompare(b.name);
            }
            return sortDirection === 'asc' ? compare : -compare;
        });

        return result;
    }, [links, searchTerm, sortColumn, sortDirection]);

    return (
        <div className="modal-overlay">
            <div className="modal-list-links">
                <div className="modal-header">
                    <h2>List of Links</h2>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    <div className="modal-controls">
                        <input
                            type="text"
                            placeholder="Search links..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            ref={searchInputRef} // Attach the ref to the input element
                        />
                        <label className="show-invalid-checkbox">
                            <input
                                type="checkbox"
                                checked={showInvalidLinks}
                                onChange={(e) => onShowInvalidLinksChange(e.target.checked)}
                            />
                            Show Invalid
                        </label>
                    </div>
                    <div className="table-container">
                        <table className="links-table">
                            <thead>
                                <tr>
                                    <th
                                        className="id-column"
                                        onClick={() => handleSort('id')}
                                    >
                                        ID {sortColumn === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    </th>
                                    <th
                                        className="name-column"
                                        onClick={() => handleSort('name')}
                                    >
                                        Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLinks.map((link) => (
                                    <tr key={link.id} onClick={() => onSelect(link.id)}>
                                        <td className="id-column">{link.id}</td>
                                        <td className="name-column">{link.name}</td>
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