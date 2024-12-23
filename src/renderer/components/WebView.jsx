// src/renderer/components/WebView.jsx

import React, { useEffect } from 'react';

function WebView({ url, webviewRef }) {
  useEffect(() => {
    if (webviewRef && webviewRef.current) {
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
      ></webview>
    </div>
  );
}

export default WebView;