// src/renderer/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import WebView from './components/WebView';
import ControlPanel from './components/ControlPanel';
import Modal from './components/Modal';
import ModalInput from './components/ModalInput';
import ModalNewLink from './components/ModalNewLink';
import './App.css';

function App() {
  const [links, setLinks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInvalidLinks, setShowInvalidLinks] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalNewLinkOpen, setModalNewLinkOpen] = useState(false);
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
    window.electronAPI.onOpenNewLinkModal(() => {
      setModalNewLinkOpen(true);
    });
  }, []);

  useEffect(() => {
    // Fetch initial links
    fetchAllLinks();
  }, [showInvalidLinks, updateCounter]);

  const fetchAllLinks = () => {
    return window.electronAPI.fetchLinks(showInvalidLinks).then((result) => {
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        setLinks(result);
        let index = (currentLink && result.findIndex((link) => link.id === currentLink.id)) || -1;
        setCurrentIndex(index === -1 ? 0 : index);
      }
      return result;
    });
  };

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

    return window.electronAPI.fetchLinks(showInvalidLinks).then((result) => {
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        setLinks(result);
        let index = links.findIndex((link) => link.id === updatedLink.id);
        setCurrentIndex(index === -1 ? 0 : index);
      }
      return result;
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

  const handleNewLink = (newLink) => {
    window.electronAPI.createLink(newLink).then((linkId) => {
      fetchAllLinks().then((result) => {
        if (!result.error) {
          const index = result.findIndex((link) => link.id === linkId);
          setCurrentIndex(index === -1 ? 0 : index);
        }
        return result;
      });
    });
    setModalNewLinkOpen(false);
  };

  const handleNewLinkCancel = () => {
    setModalNewLinkOpen(false);
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
      {modalNewLinkOpen && (
        <ModalNewLink
          onOK={handleNewLink}
          onCancel={handleNewLinkCancel}
        />)}
    </div>
  );
}

export default App;