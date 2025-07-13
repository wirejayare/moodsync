// src/components/PlaylistCreator.js - Fixed version
import React, { useState } from 'react';
import SpotifyPlayer from './SpotifyPlayer';

const PlaylistCreator = ({ spotifyToken, analysis, spotifyUser }) => {
  const [playlistName, setPlaylistName] = useState('');
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
    if (!playlistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    setIsCreating(true);
    try {
      console.log('🎵 Creating playlist with data:', {
        accessToken: spotifyToken ? 'present' : 'missing',
        analysis: analysis,
        playlistName: playlistName
      });

      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: spotifyToken,
          analysis: analysis,
          playlistName: playlistName
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        // Check if it's a token expiration error
        if (errorText.includes('access token expired') || errorText.includes('token expired')) {
          alert('Your Spotify session has expired. Please reconnect your Spotify account to create playlists.');
          // You could also trigger a reconnection flow here
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Playlist creation response:', data);
      
      if (data.success) {
        setCreatedPlaylist(data.playlist);
        if (data.isPreview) {
          alert(`👀 Playlist preview generated! Connect Spotify to create the actual playlist.`);
        } else {
          alert(`🎉 Playlist "${data.playlist.name}" created successfully!`);
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
      <section className="apple-glass playlist-creator" aria-label="Create Playlist Preview">
        <h3 className="pc-title">🎵 Song Recommendations</h3>
        <p className="pc-desc">AI-generated music recommendations based on your Pinterest board</p>
        
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
                onConnectClick={() => {
                  // This would typically trigger Spotify OAuth
                  alert('Please connect your Spotify account to save playlists and get personalized recommendations!');
                }}
              />
            </div>
          </div>
        ) : (
          <div className="pc-summary">
            <p><strong>Based on:</strong> {getMood(analysis)}</p>
            <p><strong>Genres:</strong> {getGenres(analysis).slice(0, 3).join(', ')}</p>
            <p><strong>Status:</strong> Generating recommendations...</p>
          </div>
        )}
        
        {/* Manual generate button as fallback */}
        <form className="pc-form" onSubmit={e => { e.preventDefault(); handleCreatePlaylist(); }}>
          <input
            type="text"
            className="pc-input"
            placeholder="Playlist name (optional)"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            aria-label="Playlist name"
            disabled={isCreating}
          />
          <button
            type="submit"
            className="pc-create-btn"
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            aria-busy={isCreating}
          >
            {isCreating ? '🎵 Generating...' : '🔄 Regenerate Recommendations'}
          </button>
        </form>
      </section>
    );
  }

  const genres = getGenres(analysis);
  const mood = getMood(analysis);

  return (
    <section className="apple-glass playlist-creator" aria-label="Create Spotify Playlist">
      <h3 className="pc-title">🎵 Create Spotify Playlist</h3>
      <form className="pc-form" onSubmit={e => { e.preventDefault(); handleCreatePlaylist(); }}>
        <input
          type="text"
          className="pc-input"
          placeholder={`${mood} Vibes`}
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          aria-label="Playlist name"
          disabled={isCreating}
        />
        <button
          type="submit"
          className="pc-create-btn"
          onClick={handleCreatePlaylist}
          disabled={isCreating || !playlistName.trim()}
          aria-busy={isCreating}
        >
          {isCreating ? '🎵 Creating...' : '🎵 Create Playlist'}
        </button>
      </form>
      <div className="pc-summary">
        <p><strong>Based on:</strong> {mood}</p>
        <p><strong>Genres:</strong> {genres.slice(0, 3).join(', ')}</p>
        <p><strong>For:</strong> {spotifyUser?.display_name || 'You'}</p>
      </div>
      {createdPlaylist && (
        <div className="pc-created">
          <h4 className="pc-created-title">
            {createdPlaylist.isPreview ? '👀 Playlist Preview Generated!' : '🎉 Playlist Created!'}
          </h4>
          
          {/* Spotify Player */}
          <div className="pc-player-section">
            <SpotifyPlayer
              tracks={createdPlaylist.tracks || []}
              isConnected={true}
              title={getBoardName(analysis)}
              onConnectClick={() => {
                // Already connected, but could trigger reconnection if needed
                console.log('Spotify already connected');
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default PlaylistCreator;
