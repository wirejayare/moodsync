import React, { useState, useEffect, useRef } from 'react';
import './SpotifyPlayer.css';

const SpotifyPlayer = ({ 
  tracks = [], 
  isPreview = false, 
  spotifyToken = null, 
  playlistName = "MoodSync Playlist",
  onTrackSelect = null 
}) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const progressInterval = useRef(null);
  const playerRef = useRef(null);

  // Initialize Spotify Web Playback SDK for logged-in users
  useEffect(() => {
    if (!spotifyToken || isPreview) return;

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load Spotify Web Playback SDK
        if (!window.Spotify) {
          const script = document.createElement('script');
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Initialize player
        const player = new window.Spotify.Player({
          name: 'MoodSync Player',
          getOAuthToken: cb => { cb(spotifyToken); }
        });

        // Error handling
        player.addListener('initialization_error', ({ message }) => {
          console.error('Player initialization error:', message);
          setError('Failed to initialize Spotify player');
        });

        player.addListener('authentication_error', ({ message }) => {
          console.error('Player authentication error:', message);
          setError('Spotify authentication failed');
        });

        player.addListener('account_error', ({ message }) => {
          console.error('Player account error:', message);
          setError('Spotify account error');
        });

        player.addListener('playback_error', ({ message }) => {
          console.error('Player playback error:', message);
          setError('Playback error');
        });

        // Playback status updates
        player.addListener('player_state_changed', state => {
          if (!state) return;
          
          setCurrentTrack(state.track_window?.current_track || null);
          setIsPlaying(!state.paused);
          setProgress(state.position || 0);
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
          console.log('Spotify player ready with device ID:', device_id);
          setDeviceId(device_id);
          setPlayer(player);
          setIsLoading(false);
        });

        // Not ready
        player.addListener('not_ready', ({ device_id }) => {
          console.log('Spotify player not ready:', device_id);
        });

        // Connect to the player
        await player.connect();
        
      } catch (error) {
        console.error('Player initialization error:', error);
        setError('Failed to initialize player');
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [spotifyToken, isPreview]);

  // Progress bar update for preview mode
  useEffect(() => {
    if (isPreview && isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1000; // 1 second
          if (newProgress >= 30000) { // 30 second preview
            setIsPlaying(false);
            setProgress(0);
            return 0;
          }
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPreview, isPlaying]);

  // Play track using Web Playback SDK
  const playTrack = async (trackUri) => {
    if (!player || !deviceId) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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
      console.error('Play track error:', error);
      setError('Failed to play track');
    }
  };

  // Play track for preview mode
  const playPreviewTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  };

  // Pause playback
  const pausePlayback = async () => {
    if (isPreview) {
      setIsPlaying(false);
      return;
    }

    if (!player) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  // Resume playback
  const resumePlayback = async () => {
    if (isPreview) {
      setIsPlaying(true);
      return;
    }

    if (!player) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Resume error:', error);
    }
  };

  // Skip to next track
  const nextTrack = async () => {
    if (!player) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Next track error:', error);
    }
  };

  // Skip to previous track
  const previousTrack = async () => {
    if (!player) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Previous track error:', error);
    }
  };

  // Handle volume change
  const handleVolumeChange = async (newVolume) => {
    setVolume(newVolume);
    
    if (!player) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Volume change error:', error);
    }
  };

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // If no tracks, show empty state
  if (!tracks || tracks.length === 0) {
    return (
      <div className="spotify-player empty">
        <div className="player-content">
          <h3>🎵 No tracks available</h3>
          <p>Connect Spotify and analyze a Pinterest board to see tracks here</p>
        </div>
      </div>
    );
  }

  // Preview mode - Show embed widget
  if (isPreview) {
    return (
      <div className="spotify-player preview">
        <div className="player-header">
          <h3>🎵 Preview Player</h3>
          <p>Representative tracks from your analysis</p>
        </div>
        
        <div className="track-list">
          {tracks.map((track, index) => (
            <div 
              key={track.id || index}
              className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
              onClick={() => {
                playPreviewTrack(track);
                if (onTrackSelect) onTrackSelect(track);
              }}
            >
              <div className="track-info">
                <div className="track-number">{index + 1}</div>
                <div className="track-details">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
              </div>
              
              {currentTrack?.id === track.id && (
                <div className="track-controls">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlaying) {
                        pausePlayback();
                      } else {
                        resumePlayback();
                      }
                    }}
                    className="play-pause-btn"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  {isPlaying && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(progress / 30000) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="player-footer">
          <p>💡 Connect Spotify to create and play the actual playlist!</p>
        </div>
      </div>
    );
  }

  // Full player mode - Show Web Playback SDK player
  return (
    <div className="spotify-player full">
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Initializing Spotify player...</p>
        </div>
      )}
      
      {error && (
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          <div className="player-header">
            <h3>🎵 {playlistName}</h3>
            <p>{tracks.length} tracks</p>
          </div>
          
          {currentTrack && (
            <div className="now-playing">
              <div className="track-artwork">
                <img 
                  src={currentTrack.album?.images?.[0]?.url || '/default-album.png'} 
                  alt={currentTrack.name}
                />
              </div>
              
              <div className="track-info">
                <div className="track-name">{currentTrack.name}</div>
                <div className="track-artist">{currentTrack.artists?.[0]?.name}</div>
                <div className="track-album">{currentTrack.album?.name}</div>
              </div>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(progress / (currentTrack.duration_ms || 30000)) * 100}%` }}
                  />
                </div>
                <div className="time-display">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(currentTrack.duration_ms || 30000)}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="player-controls">
            <button onClick={previousTrack} className="control-btn">⏮️</button>
            <button 
              onClick={isPlaying ? pausePlayback : resumePlayback}
              className="play-pause-btn"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={nextTrack} className="control-btn">⏭️</button>
          </div>
          
          <div className="volume-control">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="volume-slider"
            />
          </div>
          
          <div className="track-list">
            {tracks.map((track, index) => (
              <div 
                key={track.id || index}
                className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => {
                  if (track.uri) {
                    playTrack(track.uri);
                  }
                  if (onTrackSelect) onTrackSelect(track);
                }}
              >
                <div className="track-info">
                  <div className="track-number">{index + 1}</div>
                  <div className="track-details">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artist">{track.artist || track.artists?.[0]?.name}</div>
                  </div>
                </div>
                
                {track.preview_url && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Play preview audio
                      const audio = new Audio(track.preview_url);
                      audio.play();
                    }}
                    className="preview-btn"
                  >
                    🎵
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SpotifyPlayer; 