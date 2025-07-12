import React, { useState, useEffect } from 'react';
import styles from './SpotifyPlayer.module.css';

const SpotifyPlayer = ({ spotifyToken, playlistUrl }) => {
  const [playlistId, setPlaylistId] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract playlist ID from URL
  useEffect(() => {
    if (playlistUrl) {
      const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        setPlaylistId(match[1]);
      }
    }
  }, [playlistUrl]);

  // Load playlist tracks
  useEffect(() => {
    if (!playlistId || !spotifyToken) return;
    
    const loadPlaylistTracks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load playlist: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.items) {
          setPlaylistTracks(data.items.map(item => item.track).filter(track => track));
        }
      } catch (error) {
        console.error('Failed to load playlist tracks:', error);
        setError('Failed to load playlist tracks: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylistTracks();
  }, [playlistId, spotifyToken]);

  const openInSpotify = (trackUri) => {
    window.open(trackUri, '_blank');
  };

  if (!spotifyToken) {
    return (
      <div className={styles.spotifyPlayerContainer}>
        <div className={styles.spotifyPlayerPlaceholder}>
          <h3>🎵 Spotify Player</h3>
          <p>Connect to Spotify to view playlist tracks</p>
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
          <h3>🎵 Playlist Tracks</h3>
          <a 
            href={playlistUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.openInSpotify}
          >
            🎧 Open in Spotify
          </a>
        </div>

        {isLoading && (
          <div className={styles.playerLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading playlist tracks...</p>
          </div>
        )}

        {/* Playlist Tracks */}
        {playlistTracks.length > 0 && (
          <div className={styles.playlistTracks}>
            <div className={styles.tracksList}>
              {playlistTracks.slice(0, 15).map((track, index) => (
                <div key={track.id} className={styles.trackItem}>
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
                  <button 
                    onClick={() => openInSpotify(track.external_urls.spotify)}
                    className={styles.playButton}
                    title="Open in Spotify"
                  >
                    ▶️
                  </button>
                </div>
              ))}
            </div>
            {playlistTracks.length > 15 && (
              <div className={styles.moreTracks}>
                <p>... and {playlistTracks.length - 15} more tracks</p>
                <a 
                  href={playlistUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.viewAllButton}
                >
                  View All in Spotify
                </a>
              </div>
            )}
          </div>
        )}

        {!isLoading && playlistTracks.length === 0 && (
          <div className={styles.noTracks}>
            <p>No tracks found in this playlist</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer; 