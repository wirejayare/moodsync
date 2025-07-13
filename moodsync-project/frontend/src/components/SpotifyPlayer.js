import React, { useState, useEffect } from 'react';
import './SpotifyPlayer.css';

const SpotifyPlayer = ({ tracks, isConnected, onConnectClick }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get the current track
  const currentTrack = tracks && tracks.length > 0 ? tracks[currentTrackIndex] : null;

  // Handle track navigation
  const nextTrack = () => {
    if (tracks && tracks.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  const prevTrack = () => {
    if (tracks && tracks.length > 0) {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  };

  // Reset to first track when tracks change
  useEffect(() => {
    setCurrentTrackIndex(0);
  }, [tracks]);

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
        <h3>Generated Playlist</h3>
        <div className="track-counter">
          {currentTrackIndex + 1} of {tracks.length}
        </div>
      </div>

      {/* Spotify Embed Player */}
      <div className="spotify-embed-container">
        {currentTrack && currentTrack.uri && (
          <iframe
            src={`https://open.spotify.com/embed/track/${currentTrack.uri.split(':').pop()}`}
            width="100%"
            height="352"
            frameBorder="0"
            allowTransparency="true"
            allow="encrypted-media"
            title={`Spotify Player - ${currentTrack.name}`}
          />
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
              onClick={() => setCurrentTrackIndex(index)}
            >
              <div className="track-number">{index + 1}</div>
              <div className="track-details">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
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