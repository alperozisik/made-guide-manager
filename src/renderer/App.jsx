// src/renderer/App.jsx
import React, { useEffect, useState, useRef } from 'react';
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
  const webviewRef = useRef(null);

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

  /**
   * dnyamic showModal
   * @param {string} text - Message in modal
   * @param {Array} buttons - Buttons in modal
   */
  const showModal = (text, buttons) => {
    setModalContent({ text, buttons });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const getCurrentWebViewURL = () => {
    if (webviewRef.current) {
      const url = webviewRef.current.getURL();
      console.log('Current WebView URL:', url);
      return url;
    }
    return '';
  };

  return (
    <div className="app-container">
      <WebView
        url={currentLink ? currentLink.url : ''}
        webviewRef={webviewRef}
      />
      <ControlPanel
        links={links}
        currentIndex={currentIndex}
        onLinkChange={handleLinkChange}
        showInvalidLinks={showInvalidLinks}
        onShowInvalidLinksChange={handleShowInvalidLinksChange}
        currentLink={currentLink}
        updateCurrentLink={updateCurrentLink}
        showModal={showModal}
        getCurrentWebViewURL={getCurrentWebViewURL}
      />
      {modalContent && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          text={modalContent.text}
          buttons={modalContent.buttons}
        />
      )}
    </div>
  );
}

export default App;