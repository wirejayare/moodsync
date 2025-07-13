import React, { useState, useEffect, useRef } from 'react';
import './SpotifyPlayer.css';

const SpotifyPlayer = ({ tracks, isConnected, onConnectClick, title = "Generated Playlist" }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);

  // Get the current track
  const currentTrack = tracks && tracks.length > 0 ? tracks[currentTrackIndex] : null;

  // Helper function to extract Spotify track ID
  const getSpotifyTrackId = (track) => {
    if (!track) return null;
    
    // Debug: Log the track object to see its structure
    console.log('🎵 Current track data:', track);
    
    // Try different possible ID fields
    if (track.id) return track.id;
    if (track.spotify_id) return track.spotify_id;
    if (track.track_id) return track.track_id;
    
    // Try to extract from URI
    if (track.uri) {
      const uriParts = track.uri.split(':');
      if (uriParts.length >= 3) {
        return uriParts[2]; // spotify:track:ID
      }
    }
    
    // Try to extract from external_urls
    if (track.external_urls && track.external_urls.spotify) {
      const url = track.external_urls.spotify;
      const match = url.match(/track\/([a-zA-Z0-9]+)/);
      if (match) return match[1];
    }
    
    // Try to extract from spotify_url
    if (track.spotify_url) {
      const match = track.spotify_url.match(/track\/([a-zA-Z0-9]+)/);
      if (match) return match[1];
    }
    
    // For preview tracks, try to construct a valid ID
    if (track.isPreview && track.name && track.artist) {
      console.log('🎵 Preview track detected, will show track info without embed');
      return null;
    }
    
    console.warn('⚠️ Could not extract Spotify track ID from:', track);
    return null;
  };

  // Get the Spotify track ID for the current track
  const spotifyTrackId = getSpotifyTrackId(currentTrack);

  // Handle track navigation with auto-play
  const nextTrack = () => {
    if (tracks && tracks.length > 0) {
      const newIndex = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(newIndex);
      // Auto-play the new track after a short delay
      setTimeout(() => {
        triggerAutoPlay();
      }, 100);
    }
  };

  const prevTrack = () => {
    if (tracks && tracks.length > 0) {
      const newIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      setCurrentTrackIndex(newIndex);
      // Auto-play the new track after a short delay
      setTimeout(() => {
        triggerAutoPlay();
      }, 100);
    }
  };

  // Function to trigger auto-play
  const triggerAutoPlay = () => {
    if (spotifyTrackId && iframeRef.current) {
      console.log('🎵 Auto-playing track:', currentTrack?.name);
      // Try to focus the iframe to trigger play
      iframeRef.current.focus();
      // Add a visual indicator that auto-play was triggered
      setIsPlaying(true);
    }
  };

  // Handle track selection with auto-play
  const handleTrackSelect = (index) => {
    console.log('🎵 Track selected:', tracks[index]?.name);
    setCurrentTrackIndex(index);
    // Auto-play the selected track after a short delay
    setTimeout(() => {
      triggerAutoPlay();
    }, 100);
  };

  // Reset to first track when tracks change
  useEffect(() => {
    setCurrentTrackIndex(0);
    setIsPlaying(false);
  }, [tracks]);

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrack && spotifyTrackId) {
      // Small delay to ensure iframe is loaded
      const timer = setTimeout(() => {
        triggerAutoPlay();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentTrackIndex, spotifyTrackId]);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="spotify-player-container">
        <div className="no-tracks-message">
          <h3>No tracks available</h3>
          <p>Generate a playlist to see tracks here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-player-container">
      <div className="player-header">
        <h3>{title}</h3>
        <div className="track-counter">
          {currentTrackIndex + 1} of {tracks.length}
        </div>
      </div>

      {/* Spotify Embed Player */}
      <div className="spotify-embed-container">
        {spotifyTrackId ? (
          <iframe
            ref={iframeRef}
            src={`https://open.spotify.com/embed/track/${spotifyTrackId}`}
            width="100%"
            height="352"
            frameBorder="0"
            allowTransparency="true"
            allow="encrypted-media"
            title={`Spotify Player - ${currentTrack?.name || 'Track'}`}
            onLoad={() => {
              console.log('🎵 Iframe loaded for track:', currentTrack?.name);
              // Try to trigger play after iframe loads
              setTimeout(() => {
                triggerAutoPlay();
              }, 500);
            }}
          />
        ) : (
          <div className="no-embed-message">
            <h4>🎵 Track Preview</h4>
            <p><strong>{currentTrack?.name || 'Unknown Track'}</strong></p>
            <p>by <strong>{currentTrack?.artist || 'Unknown Artist'}</strong></p>
            <p className="embed-note">
              💡 Connect your Spotify account to hear this track and save the playlist!
            </p>
          </div>
        )}
      </div>

      {/* Track Navigation */}
      <div className="track-navigation">
        <button 
          onClick={prevTrack} 
          disabled={tracks.length <= 1}
          className="nav-button"
        >
          ⏮ Previous
        </button>
        
        <div className="track-info">
          <div className="track-name">{currentTrack?.name || 'Unknown Track'}</div>
          <div className="track-artist">{currentTrack?.artist || 'Unknown Artist'}</div>
          {isPlaying && (
            <div className="auto-play-indicator">🎵 Auto-playing...</div>
          )}
        </div>
        
        <button 
          onClick={nextTrack} 
          disabled={tracks.length <= 1}
          className="nav-button"
        >
          Next ⏭
        </button>
      </div>

      {/* Track List */}
      <div className="track-list">
        <h4>All Tracks ({tracks.length})</h4>
        <div className="tracks-container">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className={`track-item ${index === currentTrackIndex ? 'active' : ''}`}
              onClick={() => handleTrackSelect(index)}
            >
              <div className="track-number">{index + 1}</div>
              <div className="track-details">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              {index === currentTrackIndex && isPlaying && (
                <div className="playing-indicator">▶️</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="connection-prompt">
          <p>💡 <strong>Pro tip:</strong> Connect your Spotify account to save this playlist and get personalized recommendations!</p>
          <button onClick={onConnectClick} className="connect-button">
            Connect Spotify Account
          </button>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayer; 