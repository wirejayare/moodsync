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

  // Pinterest boards (replace with real fetch)
  const [boards, setBoards] = useState([
    { id: 'sunset-vibes', name: '🌅 Sunset Vibes', pinCount: 47 },
    { id: 'cozy-cafe', name: '☕ Cozy Café Aesthetic', pinCount: 23 },
    { id: 'ocean-dreams', name: '🌊 Ocean Dreams', pinCount: 31 },
    { id: 'city-lights', name: '🏙️ City Lights & Neon', pinCount: 19 },
    { id: 'forest-path', name: '🌲 Forest Path Wanderlust', pinCount: 28 },
    { id: 'minimalist', name: '✨ Minimalist Moments', pinCount: 42 }
  ]);
  const [selectedBoard, setSelectedBoard] = useState('');

  // Playlist and progress
  const [playlist, setPlaylist] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready to generate playlist');
  const [showStatus, setShowStatus] = useState(false);

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
    } catch (error) {
      setStatusText('❌ Error generating playlist');
      setProgress(100);
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  };

  // Save to Spotify (simulate)
  const handleSaveToSpotify = async (playlistData) => {
    alert('Saving playlist to Spotify! (Implement real logic)');
  };

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
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <PinterestPanel
          boards={boards}
          selectedBoard={selectedBoard}
          onBoardSelect={handleBoardSelect}
          onGeneratePlaylist={handleGeneratePlaylist}
          boardPreviews={BOARD_PREVIEWS}
        />
        <SpotifyPanel
          playlist={playlist}
          onSaveToSpotify={handleSaveToSpotify}
          isGenerating={isGenerating}
        />
      </div>
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