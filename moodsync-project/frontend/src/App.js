import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    // Check if this is a Spotify callback
    if (window.location.pathname === '/callback') {
      setIsCallback(true);
      handleSpotifyCallback();
      return;
    }

    // Test backend connection
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('✅ Connected'))
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  const handleSpotifyCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      alert('Spotify authorization failed: ' + error);
      window.location.href = '/';
      return;
    }

    if (code) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/spotify/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await response.json();
        
        if (data.success) {
          setSpotifyToken(data.access_token);
          setSpotifyUser(data.user);
          alert(`Welcome ${data.user.display_name}! Spotify connected.`);
        } else {
          alert('Failed to connect: ' + data.message);
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
      
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

  // Show callback processing screen
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
          <p><strong>Spotify:</strong> {spotifyUser ? `✅ ${spotifyUser.display_name}` : '❌ Not connected'}</p>
        </div>

        {!spotifyUser ? (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '2rem',
            borderRadius: '15px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🎵 Connect Spotify</h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
              Connect your Spotify account to create playlists
            </p>
            
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
          </div>
        ) : (
          <div style={{
            background: 'rgba(40, 167, 69, 0.2)',
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid rgba(40, 167, 69, 0.5)'
          }}>
            <h3>🎉 Spotify Connected!</h3>
            <p style={{ margin: '1rem 0' }}>
              Welcome, <strong>{spotifyUser.display_name}</strong>!
            </p>
            <p style={{ opacity: 0.9 }}>
              Ready to create playlists from your Pinterest boards.
            </p>
          </div>
        )}
        
        <p style={{ opacity: 0.7, marginTop: '2rem' }}>
          🚧 Step 2: Spotify authentication
        </p>
      </div>
    </div>
  );
}

export default App;
