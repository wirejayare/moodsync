// src/components/PlaylistCreator.js - Fixed version with proper OAuth flow
import React, { useState } from 'react';
import SpotifyPlayer from './SpotifyPlayer';

const PlaylistCreator = ({ spotifyToken, analysis, spotifyUser, onSpotifyAuth }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);

  // Auto-load preview when analysis changes
  React.useEffect(() => {
    console.log('🔍 PlaylistCreator - Analysis changed:', analysis);
    console.log('🔍 PlaylistCreator - AutoPreview available:', analysis?.autoPreview);
    console.log('🔍 PlaylistCreator - Current createdPlaylist:', createdPlaylist);
    
    if (analysis && analysis.autoPreview && !createdPlaylist) {
      console.log('🎵 Auto-loading preview from analysis data');
      setCreatedPlaylist(analysis.autoPreview);
    }
  }, [analysis, createdPlaylist]);

  // Reset created playlist when analysis changes
  React.useEffect(() => {
    if (analysis && !analysis.autoPreview) {
      console.log('🔄 Resetting created playlist - no autoPreview');
      setCreatedPlaylist(null);
    }
  }, [analysis]);

  const handleCreatePlaylist = async () => {
    setIsCreating(true);
    try {
      const boardName = getBoardName(analysis);
      console.log('🎵 Creating playlist with data:', {
        accessToken: spotifyToken ? 'present' : 'missing',
        analysis: analysis,
        playlistName: boardName
      });

      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: spotifyToken,
          analysis: analysis,
          playlistName: boardName
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        // Check if it's a token expiration error
        if (errorText.includes('access token expired') || errorText.includes('token expired')) {
          alert('Your Spotify session has expired. Please reconnect your Spotify account to create playlists.');
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Playlist creation response:', data);
      
      if (data.success) {
        setCreatedPlaylist(data.playlist);
        if (data.isPreview) {
          console.log('👀 Playlist preview generated!');
        } else {
          console.log(`🎉 Playlist "${data.playlist.name}" created successfully!`);
          // Don't show alert for logged-in users, let the embedded player show the success
        }
      } else {
        console.error('❌ Playlist creation failed:', data);
        alert('Failed to create playlist: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Playlist creation error:', error);
      alert('Error creating playlist: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Spotify OAuth
  const handleSpotifyAuth = async () => {
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Helper function to safely get genres from either analysis format
  const getGenres = (analysis) => {
    if (!analysis) return [];
    if (analysis.music && analysis.music.primary_genres) {
      return analysis.music.primary_genres;
    }
    if (analysis.genres) {
      return analysis.genres;
    }
    return ['pop', 'indie'];
  };

  // Helper function to safely get mood from either analysis format
  const getMood = (analysis) => {
    if (!analysis) return 'Unknown';
    if (analysis.mood && analysis.mood.primary) {
      return analysis.mood.primary;
    }
    if (analysis.mood && typeof analysis.mood === 'string') {
      return analysis.mood;
    }
    return 'Mood';
  };

  // Helper function to get board name from analysis
  const getBoardName = (analysis) => {
    if (!analysis) return 'Pinterest Board';
    if (analysis.board && analysis.board.name) {
      return analysis.board.name;
    }
    if (analysis.board && analysis.board.detected_theme) {
      return `${analysis.board.detected_theme} Vibes`;
    }
    return 'Pinterest Board';
  };

  if (!analysis) {
    return (
      <section className="apple-glass playlist-creator empty" aria-label="Create Playlist">
        <h3 className="pc-title">🎵 Create Playlist</h3>
        <p className="pc-desc">Analyze a Pinterest board first to create a mood-based playlist</p>
      </section>
    );
  }

  // Check if Spotify is connected
  if (!spotifyToken) {
    return (
      <section className="apple-glass playlist-creator" aria-label="AI-Generated Recommendations">
        {/* Show preview if available */}
        {createdPlaylist ? (
          <div className="pc-created">
            <h4 className="pc-created-title">
              👀 AI-Generated Recommendations
            </h4>
            
            {/* Spotify Player for Preview */}
            <div className="pc-player-section">
              <SpotifyPlayer
                tracks={createdPlaylist.tracks || []}
                isConnected={false}
                title={getBoardName(analysis)}
                onConnectClick={null} // Remove redundant connect button from player
              />
            </div>
            
            {/* Single connect button with pro tip */}
            <div className="pc-connect-section">
              <p className="pc-pro-tip">💡 Pro tip: Connect your Spotify account to save this playlist and get personalized recommendations!</p>
              <button
                className="pc-connect-btn"
                onClick={handleSpotifyAuth}
              >
                Connect Spotify Account
              </button>
            </div>
          </div>
        ) : (
          <div className="pc-summary">
            <p><strong>Based on:</strong> {getMood(analysis)}</p>
            <p><strong>Genres:</strong> {getGenres(analysis).slice(0, 3).join(', ')}</p>
            <p><strong>Status:</strong> Generating recommendations...</p>
          </div>
        )}
      </section>
    );
  }

  const genres = getGenres(analysis);
  const mood = getMood(analysis);
  const boardName = getBoardName(analysis);

  return (
    <section className="apple-glass playlist-creator" aria-label="Create Spotify Playlist">
      <h3 className="pc-title">🎵 Create Spotify Playlist</h3>
      
      {/* Show create button if no playlist created yet */}
      {!createdPlaylist ? (
        <div className="pc-create-section">
          <p className="pc-create-desc">Create a playlist named "{boardName}" based on your Pinterest board</p>
          <button
            className="pc-create-btn"
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            aria-busy={isCreating}
          >
            {isCreating ? '🎵 Creating...' : '🎵 Create Playlist'}
          </button>
        </div>
      ) : (
        <div className="pc-created">
          <h4 className="pc-created-title">
            {createdPlaylist.isPreview ? '👀 Playlist Preview Generated!' : '🎉 Playlist Created!'}
          </h4>
          
          {/* Spotify Player */}
          <div className="pc-player-section">
            <SpotifyPlayer
              tracks={createdPlaylist.tracks || []}
              isConnected={true}
              title={boardName}
              onConnectClick={null} // Remove redundant connect button from player
            />
          </div>
        </div>
      )}
      
      <div className="pc-summary">
        <p><strong>Based on:</strong> {mood}</p>
        <p><strong>Genres:</strong> {genres.slice(0, 3).join(', ')}</p>
        <p><strong>For:</strong> {spotifyUser?.display_name || 'You'}</p>
        <p><strong>Playlist:</strong> {boardName}</p>
      </div>
    </section>
  );
};

export default PlaylistCreator;
