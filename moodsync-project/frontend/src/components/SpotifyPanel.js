import React from 'react';
import styles from './SpotifyPanel.module.css';

const SpotifyPanel = ({
  playlist = [],
  onSaveToSpotify,
  isGenerating = false
}) => {
  const handleSaveToSpotify = () => {
    if (playlist.length === 0) {
      alert('No playlist to save! Generate a playlist first.');
      return;
    }
    onSaveToSpotify(playlist);
  };

  const renderPlaylistTracks = () => {
    if (playlist.length === 0) {
      return (
        <div className={styles.emptyPlaylist}>
          <div className={styles.emptyText}>No playlist generated yet</div>
          <div className={styles.emptySubtext}>Select a board and click "Generate Playlist"</div>
        </div>
      );
    }

    return playlist.map((track, index) => (
      <div key={index} className={styles.playlistTrack}>
        <div className={styles.trackNumber}>{index + 1}</div>
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{track.title}</div>
          <div className={styles.trackArtist}>{track.artist}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>🎵 Generated Playlist</div>
      
      <div className={styles.playlistTracks}>
        {renderPlaylistTracks()}
      </div>
      
      <button 
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={handleSaveToSpotify}
        disabled={playlist.length === 0 || isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Save to Spotify'}
      </button>
    </div>
  );
};

export default SpotifyPanel; 