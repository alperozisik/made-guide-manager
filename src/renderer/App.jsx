// src/renderer/App.jsx
import React, { useEffect, useState } from 'react';
import WebView from './components/WebView';
import ControlPanel from './components/ControlPanel';
import Modal from './components/Modal';
import './App.css';

function App() {
  const [links, setLinks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInvalidLinks, setShowInvalidLinks] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    // Fetch initial links
    window.electronAPI.fetchLinks(showInvalidLinks).then((result) => {
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        setLinks(result);
        setCurrentIndex(0);
      }
    });
  }, [showInvalidLinks]);

  useEffect(() => {
    if (links.length > 0) {
      setCurrentLink(links[currentIndex]);
    }
  }, [links, currentIndex]);

  const handleLinkChange = (index) => {
    setCurrentIndex(index);
  };

  const handleShowInvalidLinksChange = (value) => {
    setShowInvalidLinks(value);
  };

  const updateCurrentLink = (updatedLink) => {
    setCurrentLink(updatedLink);
    // Update the link in the links array
    setLinks((prevLinks) => {
      const newLinks = [...prevLinks];
      newLinks[currentIndex] = updatedLink;
      return newLinks;
    });
  };

  const showModal = (content) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="app-container">
      <WebView url={currentLink ? currentLink.url : ''} />
      <ControlPanel
        links={links}
        currentIndex={currentIndex}
        onLinkChange={handleLinkChange}
        showInvalidLinks={showInvalidLinks}
        onShowInvalidLinksChange={handleShowInvalidLinksChange}
        currentLink={currentLink}
        updateCurrentLink={updateCurrentLink}
        showModal={showModal}
      />
      {modalContent && (
        <Modal onClose={closeModal}>
          {modalContent}
        </Modal>
      )}
    </div>
  );
}

export default App;