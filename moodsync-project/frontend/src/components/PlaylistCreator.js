// src/components/PlaylistCreator.js
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

  if (!analysis) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '15px',
        textAlign: 'center',
        opacity: 0.6
      }}>
        <h3>🎵 Create Playlist</h3>
        <p>Analyze a Pinterest board first to create a mood-based playlist</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>🎵 Create Spotify Playlist</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder={`${analysis.mood} Vibes`}
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            marginBottom: '1rem'
          }}
        />
        
        <button
          onClick={handleCreatePlaylist}
          disabled={isCreating || !playlistName.trim()}
          style={{
            background: isCreating ? '#ccc' : '#1db954',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isCreating ? '🎵 Creating...' : '🎵 Create Playlist'}
        </button>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Based on:</strong> {analysis.mood}</p>
        <p><strong>Genres:</strong> {analysis.genres.slice(0, 3).join(', ')}</p>
        <p><strong>For:</strong> {spotifyUser?.display_name}</p>
      </div>

      {createdPlaylist && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.3)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginTop: '1rem',
          border: '2px solid rgba(40, 167, 69, 0.5)'
        }}>
          <h4>🎉 Playlist Created!</h4>
          <p><strong>Name:</strong> {createdPlaylist.name}</p>
          <p><strong>Tracks:</strong> {createdPlaylist.trackCount} songs</p>
          
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
              fontWeight: 'bold'
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
