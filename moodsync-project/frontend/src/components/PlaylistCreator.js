// src/components/PlaylistCreator.js - Fixed version
import React, { useState } from 'react';
import SpotifyPlayer from './SpotifyPlayer';
import VisionAnalysisDisplay from './VisionAnalysisDisplay';

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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Playlist creation response:', data);
      
      if (data.success) {
        setCreatedPlaylist(data.playlist);
        alert(`🎉 Playlist "${data.playlist.name}" created successfully!`);
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

  if (!analysis) {
    return (
      <section className="apple-glass playlist-creator empty" aria-label="Create Playlist">
        <h3 className="pc-title">🎵 Create Playlist</h3>
        <p className="pc-desc">Analyze a Pinterest board first to create a mood-based playlist</p>
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
          <h4 className="pc-created-title">🎉 Playlist Created!</h4>
          <p><strong>Name:</strong> {createdPlaylist.name}</p>
          <p><strong>Tracks:</strong> {createdPlaylist.trackCount} songs</p>
          <a
            href={createdPlaylist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pc-open-spotify"
          >
            🎧 Open in Spotify
          </a>
          
          {/* Vision Analysis Display */}
          <VisionAnalysisDisplay analysis={analysis} />
          
          {/* Embedded Spotify Player */}
          <SpotifyPlayer 
            spotifyToken={spotifyToken}
            playlistUrl={createdPlaylist.url}
          />
        </div>
      )}
    </section>
  );
};

export default PlaylistCreator;
