import React, { useState, useEffect, useRef } from 'react';
import styles from './SpotifyPlayer.module.css';

const SpotifyPlayer = ({ spotifyToken, playlistUrl }) => {
  const [player, setPlayer] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [playlistId, setPlaylistId] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract playlist ID from URL
  useEffect(() => {
    if (playlistUrl) {
      const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        setPlaylistId(match[1]);
      }
    }
  }, [playlistUrl]);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!spotifyToken || !playlistId) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'MoodSync Web Player',
        getOAuthToken: cb => { cb(spotifyToken); }
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        setError('Failed to initialize player: ' + message);
      });

      player.addListener('authentication_error', ({ message }) => {
        setError('Authentication failed: ' + message);
      });

      player.addListener('account_error', ({ message }) => {
        setError('Account error: ' + message);
      });

      player.addListener('playback_error', ({ message }) => {
        setError('Playback error: ' + message);
      });

      // Playback status updates
      player.addListener('player_state_changed', state => {
        if (!state) return;
        
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setIsActive(true);
        setPlayer(player);
        loadPlaylistTracks();
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsActive(false);
      });

      // Connect to the player
      player.connect();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [spotifyToken, playlistId]);

  // Load playlist tracks
  const loadPlaylistTracks = async () => {
    if (!playlistId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      
      const data = await response.json();
      if (data.items) {
        setPlaylistTracks(data.items.map(item => item.track).filter(track => track));
      }
    } catch (error) {
      setError('Failed to load playlist tracks: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Playback controls
  const togglePlay = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const skipNext = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const skipPrevious = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const setVolumeLevel = (newVolume) => {
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume / 100);
    }
  };

  const playTrack = async (trackUri) => {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });
    } catch (error) {
      setError('Failed to play track: ' + error.message);
    }
  };

  if (!spotifyToken) {
    return (
      <div className={styles.spotifyPlayerContainer}>
        <div className={styles.spotifyPlayerPlaceholder}>
          <h3>🎵 Spotify Player</h3>
          <p>Connect to Spotify to enable playback</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.spotifyPlayerContainer}>
        <div className={styles.spotifyPlayerError}>
          <h3>⚠️ Player Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.spotifyPlayerContainer}>
      <div className={styles.spotifyPlayer}>
        <div className={styles.playerHeader}>
          <h3>🎵 MoodSync Player</h3>
          {isActive && <span className={styles.playerStatus}>● Connected</span>}
        </div>

        {/* Current Track Display */}
        {currentTrack && (
          <div className={styles.currentTrack}>
            <img 
              src={currentTrack.album.images[0]?.url} 
              alt={currentTrack.name}
              className={styles.trackArtwork}
            />
            <div className={styles.trackInfo}>
              <div className={styles.trackName}>{currentTrack.name}</div>
              <div className={styles.trackArtist}>{currentTrack.artists[0].name}</div>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className={styles.playerControls}>
          <button 
            onClick={skipPrevious}
            className={styles.controlBtn}
            disabled={!isActive}
          >
            ⏮️
          </button>
          <button 
            onClick={togglePlay}
            className={`${styles.controlBtn} ${styles.playBtn}`}
            disabled={!isActive}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button 
            onClick={skipNext}
            className={styles.controlBtn}
            disabled={!isActive}
          >
            ⏭️
          </button>
        </div>

        {/* Volume Control */}
        <div className={styles.volumeControl}>
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>

        {/* Playlist Tracks */}
        {playlistTracks.length > 0 && (
          <div className={styles.playlistTracks}>
            <h4>Playlist Tracks</h4>
            <div className={styles.tracksList}>
              {playlistTracks.slice(0, 10).map((track, index) => (
                <div 
                  key={track.id} 
                  className={`${styles.trackItem} ${currentTrack?.id === track.id ? styles.active : ''}`}
                  onClick={() => playTrack(track.uri)}
                >
                  <span className={styles.trackNumber}>{index + 1}</span>
                  <img 
                    src={track.album.images[0]?.url} 
                    alt={track.name}
                    className={styles.trackThumbnail}
                  />
                  <div className={styles.trackDetails}>
                    <div className={styles.trackTitle}>{track.name}</div>
                    <div className={styles.trackArtist}>{track.artists[0].name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className={styles.playerLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading playlist...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer; 