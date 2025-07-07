import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [message, setMessage] = useState('Hello from MoodSync!');

  useEffect(() => {
    // Test backend connection
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Connected');
        setMessage('Backend connected successfully!');
      })
      .catch(() => {
        setBackendStatus('❌ Not connected');
        setMessage('Backend connection failed');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
          🎨 MoodSync
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Transform Pinterest moodboards into Spotify playlists
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '2rem'
        }}>
          <h3>System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p style={{ marginTop: '1rem' }}>{message}</p>
        </div>

        <button 
          onClick={() => setMessage('Test button clicked!')}
          style={{
            background: '#1db954',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '25px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Test Connection
        </button>
        
        <p style={{ opacity: 0.7, marginTop: '2rem' }}>
          🚧 Step 1: Backend connection
        </p>
      </div>
    </div>
  );
}

export default App;
