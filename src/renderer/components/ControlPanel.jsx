// src/renderer/components/ControlPanel.jsx

import React, { useState, useEffect } from 'react';
import './ControlPanel.css';

function ControlPanel({
  links,
  currentIndex,
  onLinkChange,
  showInvalidLinks,
  onShowInvalidLinksChange,
  currentLink,
  updateCurrentLink,
  showModal,
}) {
  const [idInput, setIdInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [certification, setCertification] = useState(false);
  const [successorInput, setSuccessorInput] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);

  // Fetch all topics on component mount
  useEffect(() => {
    window.electronAPI.fetchAllTopics().then((response) => {
      if (Array.isArray(response)) {
        setAllTopics(response);
      } else {
        console.error('Unexpected response:', response);
        setAllTopics([]);
      }
    });
  }, []);

  // Initialize inputs when currentLink changes
  useEffect(() => {
    if (currentLink) {
      setIdInput(currentLink.id.toString());
      setUrlInput(currentLink.url);
      setNameInput(currentLink.name);
      setCertification(!!currentLink.certification);
      setSuccessorInput(currentLink.successor ? currentLink.successor.toString() : '');
      setSelectedTopics(currentLink.topics || []);
    }
  }, [currentLink]);

  /**
   * Handle ID search when user presses 'Go' or 'Enter'.
   */
  const handleIdSearch = () => {
    const id = parseInt(idInput);
    if (isNaN(id) || id <= 0) {
      alert('Please enter a valid positive integer for ID.');
      return;
    }
    window.electronAPI.findLinkById(id, showInvalidLinks).then((result) => {
      if (result.error) {
        alert(result.error);
      } else {
        // Update the current link and index
        const index = links.findIndex((link) => link.id === result.id);
        if (index !== -1) {
          onLinkChange(index);
        } else {
          // If not found in current list, add it
          onLinkChange(links.length); // Set to new index
          updateCurrentLink(result);
        }
      }
    });
  };

  /**
   * Handle URL changes.
   */
  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
  };

  const handleUrlBlur = () => {
    const trimmedUrl = urlInput.trim();
    if (trimmedUrl !== currentLink.url) {
      const updatedLink = { ...currentLink, url: trimmedUrl };
      updateCurrentLink(updatedLink);
      window.electronAPI.updateLink(updatedLink);
    }
  };

  /**
   * Handle 'Retrieve from Preview' button click.
   */
  const handleRetrieveFromPreview = () => {
    // Check if the WebView's URL is different
    const webviewUrl = window.electronAPI.getWebViewUrl();
    if (webviewUrl === currentLink.url) {
      alert('WebView URL is the same as the current link URL.');
      return;
    }

    // Show modal dialog
    showModal(
      <div>
        <p>
          Would you like to create a new version of the link (recommended) or update the current
          record?
        </p>
        <button onClick={handleNewLink}>New Link</button>
        <button onClick={handleUpdateCurrent}>Update Current</button>
      </div>
    );
  };

  const handleNewLink = () => {
    // Close modal
    showModal(null);

    // Create new link
    const newLink = {
      ...currentLink,
      id: undefined, // Let the database assign a new ID
      url: window.electronAPI.getWebViewUrl(),
      valid: 1,
    };
    window.electronAPI.createLink(newLink).then((createdLink) => {
      // Add new link to the list and update state
      updateCurrentLink(createdLink);
      onLinkChange(links.length); // Set to new index
    });
  };

  const handleUpdateCurrent = () => {
    // Close modal
    showModal(null);

    // Update current link
    const updatedLink = {
      ...currentLink,
      url: window.electronAPI.getWebViewUrl(),
    };
    updateCurrentLink(updatedLink);
    window.electronAPI.updateLink(updatedLink);
  };

  /**
   * Handle Name changes.
   */
  const handleNameChange = (e) => {
    setNameInput(e.target.value);
  };

  const handleNameBlur = () => {
    const trimmedName = nameInput.trim();
    if (trimmedName !== currentLink.name) {
      const updatedLink = { ...currentLink, name: trimmedName };
      updateCurrentLink(updatedLink);
      window.electronAPI.updateLink(updatedLink);
    }
  };

  /**
   * Handle Certification checkbox change.
   */
  const handleCertificationChange = (e) => {
    setCertification(e.target.checked);
    const updatedLink = { ...currentLink, certification: e.target.checked ? 1 : 0 };
    updateCurrentLink(updatedLink);
    window.electronAPI.updateLink(updatedLink);
  };

  /**
   * Handle Successor ID changes.
   */
  const handleSuccessorChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setSuccessorInput(value);
      const updatedLink = {
        ...currentLink,
        successor: value ? parseInt(value) : null,
      };
      updateCurrentLink(updatedLink);
      window.electronAPI.updateLink(updatedLink);
    } else {
      // Invalid input, revert to last valid value
      setSuccessorInput(currentLink.successor ? currentLink.successor.toString() : '');
    }
  };

  /**
   * Handle topic selection changes.
   */
  const handleTopicChange = (topicKey) => {
    let updatedTopics;
    if (selectedTopics.includes(topicKey)) {
      // Remove topic
      updatedTopics = selectedTopics.filter((key) => key !== topicKey);
    } else {
      // Add topic
      updatedTopics = [...selectedTopics, topicKey];
    }
    setSelectedTopics(updatedTopics);

    // Update link in database
    const updatedLink = { ...currentLink, topics: updatedTopics };
    updateCurrentLink(updatedLink);
    window.electronAPI.updateLink(updatedLink);
  };

  /**
   * Handle Valid status toggle.
   */
  const handleValidToggle = () => {
    const newValidStatus = currentLink.valid ? 0 : 1;
    const updatedLink = { ...currentLink, valid: newValidStatus };
    updateCurrentLink(updatedLink);
    window.electronAPI.updateLink(updatedLink);

    // If the link was invalidated and showInvalidLinks is false, enable it
    if (newValidStatus === 0 && !showInvalidLinks) {
      onShowInvalidLinksChange(true);
    }
  };

  /**
   * Render the control panel.
   */
  return (
    <div className="control-panel">
      {/* 1. Show Invalid Links Checkbox */}
      <div className="control-item">
        <label>
          <input
            type="checkbox"
            checked={showInvalidLinks}
            onChange={(e) => onShowInvalidLinksChange(e.target.checked)}
          />
          Show invalid links
        </label>
      </div>

      {/* 2. Navigation Controls */}
      <div className="control-item navigation">
        <button onClick={() => onLinkChange(0)}>&lt;&lt;</button>
        <button onClick={() => onLinkChange(Math.max(currentIndex - 1, 0))}>&lt;</button>
        <span>
          {currentIndex + 1} / {links.length}
        </span>
        <button onClick={() => onLinkChange(Math.min(currentIndex + 1, links.length - 1))}>
          &gt;
        </button>
        <button onClick={() => onLinkChange(links.length - 1)}>&gt;&gt;</button>
      </div>

      {/* 3. ID Input */}
      <div className="control-item">
        <label>ID:</label>
        <input
          type="text"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleIdSearch();
            }
          }}
        />
        <button onClick={handleIdSearch}>Go</button>
      </div>

      {/* 4. URL Input */}
      <div className="control-item">
        <label>URL:</label>
        <textarea value={urlInput} onChange={handleUrlChange} onBlur={handleUrlBlur} rows={3} />
      </div>

      {/* 5. Retrieve from Preview */}
      <div className="control-item">
        <button onClick={handleRetrieveFromPreview}>Retrieve from Preview</button>
      </div>

      {/* 6. Name Input */}
      <div className="control-item">
        <label>Name:</label>
        <input type="text" value={nameInput} onChange={handleNameChange} onBlur={handleNameBlur} />
      </div>

      {/* 7. Certification Checkbox and Valid Toggle */}
      <div className="control-item">
        <label>
          <input type="checkbox" checked={certification} onChange={handleCertificationChange} />
          Certification
        </label>
        <button onClick={handleValidToggle} style={{ marginLeft: '10px' }}>
          {currentLink && currentLink.valid ? 'Make the link invalid' : 'Make the link valid'}
        </button>
      </div>

      {/* 8. Successor Input */}
      <div className="control-item">
        <label>Successor ID:</label>
        <input type="text" value={successorInput} onChange={handleSuccessorChange} />
      </div>

      {/* 9. MADE_Topics List */}
      <div className="control-item">
        <label>MADE Topics:</label>
        <div className="topics-list">
          {Array.isArray(allTopics) && allTopics.length > 0 ? (
            allTopics.map((topic) => (
              <div key={topic.Topic}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic.Topic)}
                    onChange={() => handleTopicChange(topic.Topic)}
                  />
                  <b>{topic.MADE}</b>&nbsp;{topic.Topic}
                </label>
              </div>
            ))
          ) : (
            <p>No topics available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;