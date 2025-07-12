import React, { useState, useEffect } from 'react';
import PlaylistCreator from './PlaylistCreator';
import PinterestPanel from './PinterestPanel';
import PinterestConnector from './PinterestConnector';

const Home = ({ 
  spotifyUser, 
  spotifyToken, 
  onSpotifyAuth,
  pinterestUser,
  pinterestToken,
  onPinterestAuth,
  onLogout
}) => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [analysis, setAnalysis] = useState(null);
  const [pinterestBoards, setPinterestBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [pinterestError, setPinterestError] = useState(null);

  useEffect(() => {
    // Test backend connection
    fetch(`https://moodsync-backend-sdbe.onrender.com/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('✅ Connected'))
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  // Fetch boards if Pinterest is connected
  useEffect(() => {
    if (pinterestToken && pinterestUser) {
      setIsLoadingBoards(true);
      setPinterestError(null);
      fetch('https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards', {
        headers: {
          'Authorization': `Bearer ${pinterestToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPinterestBoards(data.boards);
          } else {
            setPinterestError(data.message || 'Failed to fetch boards');
          }
        })
        .catch(err => setPinterestError(err.message))
        .finally(() => setIsLoadingBoards(false));
    } else {
      setPinterestBoards([]);
      setSelectedBoard(null);
    }
  }, [pinterestToken, pinterestUser]);

  // Handler for board selection
  const handleBoardSelect = (boardId) => {
    setSelectedBoard(boardId);
  };

  // Handler for playlist generation (boardId or boardUrl)
  const handleGeneratePlaylist = async (boardOrUrl) => {
    setAnalysis(null);
    let analysisData = null;
    
    // Start animated analysis
    const startAnimatedAnalysis = () => {
      // This will be triggered by the PlaylistCreator component
      // when it receives the analysis data
    };
    
    try {
      if (typeof boardOrUrl === 'string' && boardOrUrl.includes('pinterest.com')) {
        // Board URL mode
        const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: boardOrUrl })
        });
        const data = await response.json();
        if (data.success) {
          analysisData = data.analysis;
        } else {
          throw new Error(data.message || 'Analysis failed');
        }
      } else {
        // Board picker mode
        const board = pinterestBoards.find(b => b.id === boardOrUrl);
        if (!board) throw new Error('Board not found');
        const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-with-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardId: board.id, pinterestToken })
        });
        const data = await response.json();
        if (data.success) {
          analysisData = data.analysis;
        } else {
          throw new Error(data.message || 'Analysis failed');
        }
      }
      setAnalysis(analysisData);
    } catch (error) {
      alert('Failed to analyze board: ' + error.message);
    }
  };

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
    <main className="home-bg" aria-label="MoodSync Home">
      <div className="home-container">
        <h1 className="home-title">🎨 MoodSync</h1>
        <p className="home-subtitle">
          Transform Pinterest moodboards into Spotify playlists
        </p>
        {/* System Status */}
        <section className="apple-glass home-status" aria-label="System Status">
          <h3 className="home-status-title">System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Spotify:</strong> {spotifyUser ? `✅ ${spotifyUser.display_name}` : '❌ Not connected'}</p>
          <p><strong>Pinterest:</strong> {pinterestUser ? `✅ @${pinterestUser.username}` : '❌ Not connected'}</p>
          {pinterestUser && (
            <div className="home-enhanced-status">
              🚀 Enhanced analysis enabled!
            </div>
          )}
        </section>
        {/* Spotify Connection */}
        {!spotifyUser ? (
          <section className="apple-glass home-spotify-connect" aria-label="Connect Spotify">
            <h3 className="home-step-title">🎵 Step 1: Connect Spotify</h3>
            <p className="home-step-desc">
              Connect your Spotify account to create playlists
            </p>
            <button 
              className="btn btn-spotify home-spotify-btn"
              onClick={handleSpotifyAuth}
            >
              🎵 Connect Spotify
            </button>
          </section>
        ) : (
          <>
            {/* Services Connected */}
            <section className="apple-glass home-services-connected" aria-label="Services Connected">
              <h3 className="home-status-title">🎉 Services Connected!</h3>
              <div className="home-service-row">
                <span><strong>Spotify:</strong> {spotifyUser.display_name}</span>
                <button 
                  className="btn btn-secondary home-disconnect-btn"
                  onClick={() => onLogout('spotify')}
                >
                  Disconnect
                </button>
              </div>
              {pinterestUser && (
                <div className="home-service-row">
                  <span><strong>Pinterest:</strong> @{pinterestUser.username}</span>
                  <button 
                    className="btn btn-secondary home-disconnect-btn"
                    onClick={() => onLogout('pinterest')}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </section>
            {/* Pinterest Analyzer */}
            <section className="home-analyzer-section">
              <h3 className="home-step-title">📌 Step 2: Analyze Pinterest Board</h3>
              {/* Show Pinterest Connector if not connected */}
              {!pinterestUser && (
                <PinterestConnector 
                  onPinterestAuth={onPinterestAuth}
                  pinterestUser={pinterestUser}
                />
              )}
              {/* Show Pinterest Panel - always show for URL analysis */}
              <PinterestPanel
                boards={pinterestBoards}
                selectedBoard={selectedBoard}
                onBoardSelect={handleBoardSelect}
                onGeneratePlaylist={handleGeneratePlaylist}
                isLoading={isLoadingBoards}
                error={pinterestError}
              />
              {/* Playlist Creator */}
              <h3 className="home-step-title">🎵 Step 3: Create Your Playlist</h3>
              <PlaylistCreator 
                spotifyToken={spotifyToken}
                analysis={analysis}
                spotifyUser={spotifyUser}
              />
            </section>
          </>
        )}
        <p className="home-flow-desc">
          🚀 Pinterest {pinterestUser ? '+ API' : ''} → AI Analysis → Spotify Playlist
        </p>
      </div>
    </main>
  );
};

export default Home;
