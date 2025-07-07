import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    // Check if this is a callback from Spotify
    if (window.location.pathname === '/callback') {
      setIsCallback(true);
      handleSpotifyCallback();
      return;
    }

    // Normal health check
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Connected');
      })
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  const handleSpotifyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      alert('Spotify authorization failed: ' + error);
      window.location.href = '/';
      return;
    }

    if (code) {
      alert('Spotify connected successfully! Code: ' + code.substring(0, 10) + '...');
      // In the future, we'll send this code to our backend
      window.location.href = '/';
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Show callback page
  if (isCallback) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <div>
          <h1>🔄 Processing Spotify Authorization...</h1>
          <p>Please wait while we connect your account.</p>
        </div>
      </div>
    );
  }

  // Show normal app
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
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🎨 MoodSync
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
          Transform Pinterest moodboards into Spotify playlists
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3>System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Frontend:</strong> ✅ Running</p>
        </div>

        <button 
          onClick={handleSpotifyAuth}
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
          🎵 Connect Spotify
        </button>

        <div style={{ marginTop: '2rem', fontSize: '14px', opacity: 0.7 }}>
          <p>🚀 Ready to build something amazing!</p>
        </div>
      </div>
    </div>
  );
}

export default App;

