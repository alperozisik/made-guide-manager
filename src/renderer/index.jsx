// src/renderer/index.jsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the main process
    window.electronAPI.fetchCurrentLinks().then((result) => {
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        setData(result);
      }
    });
  }, []);

  // Render the data as a table
  return (
    <div>
      <h1>Current Links</h1>
      {data.length > 0 ? (
        <table border="1">
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
}

// Render the App component into the root div
ReactDOM.render(<App />, document.getElementById('root'));