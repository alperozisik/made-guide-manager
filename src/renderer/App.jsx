// src/renderer/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import WebView from './components/WebView';
import ControlPanel from './components/ControlPanel';
import Modal from './components/Modal';
import ModalInput from './components/ModalInput';
import './App.css';

function App() {
  const [links, setLinks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInvalidLinks, setShowInvalidLinks] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const webviewRef = useRef(null);

  // State for ModalInput
  const [isModalInputOpen, setIsModalInputOpen] = useState(false);
  const [modalInputProps, setModalInputProps] = useState({
    title: '',
    message: '',
    suggestion: '',
    onOK: null,
    onCancel: null,
  });

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
  }, [showInvalidLinks, updateCounter]);

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

    window.electronAPI.fetchLinks(showInvalidLinks).then((result) => {
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        setLinks(result);
        let index = links.findIndex((link) => link.id === updatedLink.id);
        setCurrentIndex(index === -1 ? 0 : index);
      }
    });

    /*  setLinks((prevLinks) => {
       const newLinks = [...prevLinks];
       newLinks[currentIndex] = updatedLink;
       return newLinks;
     }); */
  };

  /**
   * dnyamic showModal
   * @param {string} text - Message in modal
   * @param {Array} buttons - Buttons in modal
   */
  const showModal = (text, buttons) => {
    let content = { text, buttons };
    if (!text)
      content = null;
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  /**
   * Function to open ModalInput
   * @param {object} props - props for ModalInput 
   */
  const showModalInput = ({ title, message, suggestion, onOK, onCancel }) => {
    setModalInputProps({ title, message, suggestion, onOK, onCancel });
    setIsModalInputOpen(true);
  };

  const closeModalInput = () => {
    setIsModalInputOpen(false);
    setModalInputProps({
      title: '',
      message: '',
      suggestion: '',
      onOK: null,
      onCancel: null,
    });
  };

  const getCurrentWebViewTitle = () => {
    if (webviewRef.current) {
      let title = webviewRef.current.getTitle();
      console.log('Current WebView Title:', title);
      return title;
    }
    return '';
  };

  const getCurrentWebViewURL = () => {
    if (webviewRef.current) {
      let url = webviewRef.current.getURL();
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
        getCurrentWebViewTitle={getCurrentWebViewTitle}
        showModalInput={showModalInput}
        updateCounter={updateCounter}
        setUpdateCounter={setUpdateCounter}
      />
      {modalContent && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          text={modalContent.text}
          buttons={modalContent.buttons}
        />
      )}
      {isModalInputOpen && (
        <ModalInput
          title={modalInputProps.title}
          message={modalInputProps.message}
          suggestion={modalInputProps.suggestion}
          onOK={(value) => {
            if (modalInputProps.onOK) {
              modalInputProps.onOK(value);
            }
            closeModalInput();
          }}
          onCancel={() => {
            if (modalInputProps.onCancel) {
              modalInputProps.onCancel();
            }
            closeModalInput();
          }}
        />
      )}
    </div>
  );
}

export default App;