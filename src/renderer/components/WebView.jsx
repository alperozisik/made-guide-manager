// src/renderer/components/WebView.jsx

import React, { useEffect, useRef } from 'react';

function WebView({ url }) {
  const webviewRef = useRef(null);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.src = url;

      // Handle events as needed
    }
  }, [url]);

  return (
    <div className="webview-container">
      <webview
        ref={webviewRef}
        style={{ width: '100%', height: '100%' }}
        allowpopups="true"
        partition="persist:webview"
        webpreferences="nativeWindowOpen,allowRunningInsecureContent"
        preload="webview-preload.js" // Use the relative path directly
      ></webview>
    </div>
  );
}

export default WebView;