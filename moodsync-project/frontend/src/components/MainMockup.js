import React, { useState, useEffect } from 'react';
import Header from './Header';
import ConnectionStatus from './ConnectionStatus';
import PinterestPanel from './PinterestPanel';
import SpotifyPanel from './SpotifyPanel';
import ConnectionLine from './ConnectionLine';
import StatusBar from './StatusBar';

// Example board preview data (can be replaced with real data)
const BOARD_PREVIEWS = {
  'sunset-vibes': [
    { text: 'Golden Beach', style: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 50%, #c44569 100%)' },
    { text: 'Pink Sky', style: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 50%, #fd79a8 100%)' },
    { text: 'Orange Horizon', style: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 50%, #d63031 100%)' },
    { text: 'Evening Glow', style: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 50%, #e84393 100%)' }
  ],
  // ...other boards
};

const MainMockup = ({
  spotifyUser,
  spotifyToken,
  onSpotifyAuth,
  pinterestUser,
  pinterestToken,
  onPinterestAuth,
  onLogout
}) => {
  // Connection status
  const [pinterestConnected, setPinterestConnected] = useState(!!pinterestUser);
  const [spotifyConnected, setSpotifyConnected] = useState(!!spotifyUser);

  // Real Pinterest boards
  const [boards, setBoards] = useState([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState('');

  // Playlist and progress
  const [playlist, setPlaylist] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready to generate playlist');
  const [showStatus, setShowStatus] = useState(false);

  // Add state for analysis and themes
  const [analysis, setAnalysis] = useState(null);
  const [themes, setThemes] = useState([]);

  // OAuth handlers
  const handleConnectPinterest = async () => {
    if (pinterestUser) return;
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleConnectSpotify = async () => {
    if (spotifyUser) return;
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Board selection
  const handleBoardSelect = (boardId) => {
    setSelectedBoard(boardId);
  };

  // Generate playlist (simulate API call)
  const handleGeneratePlaylist = async (boardId) => {
    if (!boardId) return;
    setIsGenerating(true);
    setShowStatus(true);
    setProgress(0);
    setStatusText('🔄 Analyzing mood & generating playlist...');
    setThemes([]);
    setAnalysis(null);
    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 10;
      setProgress(Math.min(100, prog));
    }, 400);
    try {
      // Replace with real backend call
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/playlist/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
        body: JSON.stringify({
          pinterestToken,
          boardId
        })
      });
      const data = await response.json();
      setPlaylist(data.tracks || []);
      setStatusText('✅ Playlist ready!');
      setProgress(100);
      setAnalysis(data.analysis || null);
      // Extract up to three keyword themes from analysis
      if (data.analysis && Array.isArray(data.analysis.detected_themes)) {
        setThemes(data.analysis.detected_themes.slice(0, 3).map(t => t.theme));
      } else if (data.analysis && data.analysis.primary_theme) {
        setThemes([data.analysis.primary_theme]);
      } else {
        setThemes([]);
      }
    } catch (error) {
      setStatusText('❌ Error generating playlist');
      setProgress(100);
      setThemes([]);
      setAnalysis(null);
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  };

  // Save to Spotify (simulate)
  const handleSaveToSpotify = async (playlistData) => {
    alert('Saving playlist to Spotify! (Implement real logic)');
  };

  // Fetch Pinterest boards when connected
  useEffect(() => {
    const fetchBoards = async () => {
      if (!pinterestToken || !pinterestUser) return;
      setBoardsLoading(true);
      setBoardsError(null);
      try {
        const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards', {
          headers: {
            'Authorization': `Bearer ${pinterestToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setBoards(data.boards);
        } else {
          throw new Error(data.message || 'Failed to fetch boards');
        }
      } catch (error) {
        setBoardsError(error.message);
      } finally {
        setBoardsLoading(false);
      }
    };
    fetchBoards();
  }, [pinterestToken, pinterestUser]);

  useEffect(() => {
    setPinterestConnected(!!pinterestUser);
  }, [pinterestUser]);
  useEffect(() => {
    setSpotifyConnected(!!spotifyUser);
  }, [spotifyUser]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '20px' }}>
      <Header />
      <ConnectionStatus
        pinterestConnected={pinterestConnected}
        spotifyConnected={spotifyConnected}
        onConnectPinterest={handleConnectPinterest}
        onConnectSpotify={handleConnectSpotify}
        onDisconnectPinterest={() => onLogout('pinterest')}
        onDisconnectSpotify={() => onLogout('spotify')}
      />
      {/* Only show main panels if both Pinterest and Spotify are connected */}
      {(pinterestConnected && spotifyConnected) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <PinterestPanel
            boards={boards}
            selectedBoard={selectedBoard}
            onBoardSelect={handleBoardSelect}
            onGeneratePlaylist={handleGeneratePlaylist}
            boardPreviews={BOARD_PREVIEWS}
            isLoading={boardsLoading}
            error={boardsError}
          />
          <div>
            {/* Show keyword themes if available */}
            {themes.length > 0 && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 18px',
                background: 'linear-gradient(90deg, #f8f9fa, #e0f7fa)',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#333',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(78,205,196,0.08)'
              }}>
                {themes.map((theme, idx) => (
                  <span key={idx} style={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    marginRight: '6px',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    boxShadow: '0 1px 4px rgba(78,205,196,0.12)'
                  }}>{theme}</span>
                ))}
              </div>
            )}
            <SpotifyPanel
              playlist={playlist}
              onSaveToSpotify={handleSaveToSpotify}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      )}
      <ConnectionLine />
      <StatusBar
        statusText={statusText}
        progress={progress}
        isVisible={showStatus}
      />
      {/* Placeholder for advanced mood analysis integration */}
    </div>
  );
};

export default MainMockup; 