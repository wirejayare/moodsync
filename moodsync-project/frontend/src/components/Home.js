import React, { useState, useEffect } from 'react';
import EnhancedPinterestAnalyzer from './EnhancedPinterestAnalyzer';
import PlaylistCreator from './PlaylistCreator';

const Home = ({ 
  spotifyUser, 
  spotifyToken, 
  onSpotifyAuth,
  pinterestUser,
  pinterestToken,
  onPinterestAuth
}) => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Test backend connection
    fetch(`https://moodsync-backend-sdbe.onrender.com/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('✅ Connected'))
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  const handleSpotifyAuth = async () => {
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleAnalysisComplete = (analysisData) => {
    setAnalysis(analysisData);
  };

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
      <div style={{ maxWidth: '700px', width: '100%' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🎨 MoodSync
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          Transform Pinterest moodboards into Spotify playlists
        </p>
        
        {/* System Status */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '15px',
          marginBottom: '2rem'
        }}>
          <h3>System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Spotify:</strong> {spotifyUser ? `✅ ${spotifyUser.display_name}` : '❌ Not connected'}</p>
          <p><strong>Pinterest:</strong> {pinterestUser ? `✅ @${pinterestUser.username}` : '❌ Not connected'}</p>
          {pinterestUser && (
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8, 
              marginTop: '8px',
              color: '#E60023'
            }}>
              🚀 Enhanced analysis enabled!
            </div>
          )}
        </div>

        {/* Spotify Connection */}
        {!spotifyUser ? (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '2rem',
            borderRadius: '15px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🎵 Step 1: Connect Spotify</h3>
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
          <>
            {/* Services Connected */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.2)',
              padding: '1.5rem',
              borderRadius: '15px',
              border: '2px solid rgba(40, 167, 69, 0.5)',
              marginBottom: '2rem'
            }}>
              <h3>🎉 Services Connected!</h3>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Spotify:</strong> {spotifyUser.display_name}
              </p>
              {pinterestUser && (
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Pinterest:</strong> @{pinterestUser.username}
                </p>
              )}
            </div>

            {/* Pinterest Analyzer */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                📌 Step 2: Analyze Pinterest Board
              </h3>
              <EnhancedPinterestAnalyzer 
                spotifyToken={spotifyToken}
                onAnalysisComplete={handleAnalysisComplete}
                pinterestToken={pinterestToken}
                pinterestUser={pinterestUser}
                onPinterestAuth={onPinterestAuth}
              />

              {/* Playlist Creator */}
              <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                🎵 Step 3: Create Your Playlist
              </h3>
              <PlaylistCreator 
                spotifyToken={spotifyToken}
                analysis={analysis}
                spotifyUser={spotifyUser}
              />
            </div>
          </>
        )}
        
        <p style={{ opacity: 0.7, marginTop: '2rem', fontSize: '14px' }}>
          🚀 Pinterest {pinterestUser ? '+ API' : ''} → AI Analysis → Spotify Playlist
        </p>
      </div>
    </div>
  );
};

export default Home;
