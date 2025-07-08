// src/components/PlaylistCreator.js - Fixed version
import React, { useState } from 'react';

const PlaylistCreator = ({ spotifyToken, analysis, spotifyUser }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: spotifyToken,
          analysis: analysis,
          playlistName: playlistName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCreatedPlaylist(data.playlist);
        alert(`🎉 Playlist "${data.playlist.name}" created successfully!`);
      } else {
        alert('Failed to create playlist: ' + data.message);
      }
    } catch (error) {
      alert('Error creating playlist: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to safely get genres from either analysis format
  const getGenres = (analysis) => {
    if (!analysis) return [];
    
    // Enhanced analysis format
    if (analysis.music && analysis.music.primary_genres) {
      return analysis.music.primary_genres;
    }
    
    // Basic analysis format
    if (analysis.genres) {
      return analysis.genres;
    }
    
    // Fallback
    return ['pop', 'indie'];
  };

  // Helper function to safely get mood from either analysis format
  const getMood = (analysis) => {
    if (!analysis) return 'Unknown';
    
    // Enhanced analysis format
    if (analysis.mood && analysis.mood.primary) {
      return analysis.mood.primary;
    }
    
    // Basic analysis format
    if (analysis.mood && typeof analysis.mood === 'string') {
      return analysis.mood;
    }
    
    // Fallback
    return 'Mood';
  };

  if (!analysis) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '15px',
        textAlign: 'center',
        opacity: 0.6,
        color: 'white'
      }}>
        <h3 style={{ color: 'white' }}>🎵 Create Playlist</h3>
        <p style={{ color: 'white' }}>Analyze a Pinterest board first to create a mood-based playlist</p>
      </div>
    );
  }

  const genres = getGenres(analysis);
  const mood = getMood(analysis);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '2rem',
      color: 'white'
    }}>
      <h3 style={{ 
        marginBottom: '1rem',
        color: 'white' 
      }}>
        🎵 Create Spotify Playlist
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder={`${mood} Vibes`}
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: '16px',
            marginBottom: '1rem',
            background: 'rgba(255,255,255,0.9)',
            color: '#333',
            boxSizing: 'border-box'
          }}
        />
        
        <button
          onClick={handleCreatePlaylist}
          disabled={isCreating || !playlistName.trim()}
          style={{
            background: isCreating ? '#999' : '#1db954',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            width: '100%',
            opacity: (isCreating || !playlistName.trim()) ? 0.6 : 1
          }}
        >
          {isCreating ? '🎵 Creating...' : '🎵 Create Playlist'}
        </button>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'white'
      }}>
        <p style={{ margin: '0.5rem 0', color: 'white' }}>
          <strong>Based on:</strong> {mood}
        </p>
        <p style={{ margin: '0.5rem 0', color: 'white' }}>
          <strong>Genres:</strong> {genres.slice(0, 3).join(', ')}
        </p>
        <p style={{ margin: '0.5rem 0', color: 'white' }}>
          <strong>For:</strong> {spotifyUser?.display_name || 'You'}
        </p>
      </div>

      {createdPlaylist && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.3)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginTop: '1rem',
          border: '2px solid rgba(40, 167, 69, 0.5)',
          color: 'white'
        }}>
          <h4 style={{ color: 'white' }}>🎉 Playlist Created!</h4>
          <p style={{ color: 'white' }}>
            <strong>Name:</strong> {createdPlaylist.name}
          </p>
          <p style={{ color: 'white' }}>
            <strong>Tracks:</strong> {createdPlaylist.trackCount} songs
          </p>
          
          <a
            href={createdPlaylist.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#1db954',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontSize: '14px',
              marginTop: '1rem',
              fontWeight: 'bold',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            🎧 Open in Spotify
          </a>
        </div>
      )}
    </div>
  );
};

export default PlaylistCreator;
