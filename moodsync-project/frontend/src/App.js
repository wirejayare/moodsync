import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isCallback, setIsCallback] = useState(false);
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);

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
        console.log('Exchanging code for access token...');
        
        // Send code to backend to get access token
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/spotify/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();
        
        if (data.success) {
          // Store the access token and user info
          setSpotifyToken(data.access_token);
          setSpotifyUser(data.user);
          
          // Show success message
          alert(`🎉 Welcome ${data.user.display_name}! Spotify connected successfully.`);
          
          console.log('Spotify connected:', data.user.display_name);
        } else {
          alert('Failed to connect to Spotify: ' + data.message);
        }
      } catch (error) {
        console.error('Callback error:', error);
        alert('Error connecting to Spotify: ' + error.message);
      }
      
      // Redirect back to main app
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

  const analyzePinterestBoard = async () => {
    if (!pinterestUrl) {
      alert('Please enter a Pinterest board URL');
      return;
    }

    if (!pinterestUrl.includes('pinterest.com')) {
      alert('Please enter a valid Pinterest URL');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCreatedPlaylist(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analyze-pinterest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pinterestUrl })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.analysis);
        
        // Auto-generate playlist name
        if (!playlistName) {
          setPlaylistName(`${data.analysis.mood} Vibes`);
        }
      } else {
        alert('Analysis failed: ' + data.message);
      }
    } catch (error) {
      alert('Error analyzing board: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createSpotifyPlaylist = async () => {
    if (!spotifyToken) {
      alert('Please connect your Spotify account first');
      return;
    }

    if (!analysisResult) {
      alert('Please analyze a Pinterest board first');
      return;
    }

    setIsCreatingPlaylist(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/create-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: spotifyToken,
          analysis: analysisResult,
          playlistName: playlistName || `${analysisResult.mood} Vibes`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCreatedPlaylist(data);
        alert(`🎉 Playlist "${data.playlist.name}" created successfully with ${data.tracks.length} tracks!`);
      } else {
        alert('Failed to create playlist: ' + data.message);
      }
    } catch (error) {
      alert('Error creating playlist: ' + error.message);
    } finally {
      setIsCreatingPlaylist(false);
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
      padding: '20px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🎨 MoodSync
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Transform Pinterest moodboards into Spotify playlists
          </p>
        </div>

        {/* Status Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3>System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Spotify:</strong> {spotifyUser ? `✅ ${spotifyUser.display_name}` : '❌ Not connected'}</p>
        </div>

        {/* Spotify Section */}
        {!spotifyUser && (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '15px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '20px' }}>🎵 Connect Spotify First</h3>
            <p style={{ marginBottom: '20px', opacity: 0.9 }}>
              Connect your Spotify account to create playlists from your Pinterest boards
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
        )}

        {/* Pinterest Analysis Section */}
        {spotifyUser && (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '15px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '20px' }}>📌 Analyze Pinterest Board</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="url"
                value={pinterestUrl}
                onChange={(e) => setPinterestUrl(e.target.value)}
                placeholder="https://pinterest.com/username/board-name"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}
              />
              
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Playlist name (auto-generated if empty)"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '16px'
                }}
              />
            </div>

            <button 
              onClick={analyzePinterestBoard}
              disabled={isAnalyzing}
              style={{
                background: isAnalyzing ? '#ccc' : '#e60023',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🎨 Analyze Moodboard'}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '15px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3>🎭 Analysis Results</h3>
            <div style={{ marginTop: '20px' }}>
              <h4>Colors Found:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {analysisResult.colors?.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      borderRadius: '50%',
                      border: '3px solid white',
                      title: color
                    }}
                  />
                ))}
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <h4>Detected Mood:</h4>
                <p style={{ fontSize: '18px', margin: '10px 0' }}>
                  {analysisResult.mood}
                </p>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4>Description:</h4>
                <p style={{ margin: '10px 0' }}>
                  {analysisResult.description}
                </p>
              </div>

              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button 
                  onClick={createSpotifyPlaylist}
                  disabled={isCreatingPlaylist}
                  style={{
                    background: isCreatingPlaylist ? '#ccc' : '#1db954',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '25px',
                    fontSize: '16px',
                    cursor: isCreatingPlaylist ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isCreatingPlaylist ? '🔄 Creating Playlist...' : '🎵 Create Spotify Playlist'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Playlist */}
        {createdPlaylist && (
          <div style={{ 
            background: 'rgba(40, 167, 69, 0.2)', 
            borderRadius: '15px',
            padding: '2rem',
            border: '2px solid rgba(40, 167, 69, 0.5)'
          }}>
            <h3>🎉 Playlist Created Successfully!</h3>
            <div style={{ marginTop: '20px' }}>
              <h4>{createdPlaylist.playlist.name}</h4>
              <p style={{ margin: '10px 0', opacity: 0.9 }}>
                {createdPlaylist.tracks.length} tracks • {createdPlaylist.playlist.description}
              </p>
              
              <div style={{ marginTop: '20px' }}>
                
                  href={createdPlaylist.playlist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#1db954',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 25px',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  🎵 Open in Spotify
                </a>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4>Track List:</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {createdPlaylist.tracks.slice(0, 5).map((track, index) => (
                    <div key={track.id} style={{ 
                      padding: '10px 0', 
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      {track.image && (
                        <img 
                          src={track.image} 
                          alt={track.album}
                          style={{ width: '50px', height: '50px', borderRadius: '5px' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{track.name}</div>
                        <div style={{ opacity: 0.8, fontSize: '14px' }}>{track.artist}</div>
                      </div>
                    </div>
                  ))}
                  {createdPlaylist.tracks.length > 5 && (
                    <div style={{ padding: '10px 0', opacity: 0.7, fontSize: '14px' }}>
                      ...and {createdPlaylist.tracks.length - 5} more tracks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
