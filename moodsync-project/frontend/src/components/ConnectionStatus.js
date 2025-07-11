import React from 'react';
import styles from './ConnectionStatus.module.css';

const ConnectionStatus = ({
  pinterestConnected,
  spotifyConnected,
  onConnectPinterest,
  onConnectSpotify,
  onDisconnectPinterest,
  onDisconnectSpotify
}) => (
  <div className={styles.connectionStatus}>
    <div
      className={
        pinterestConnected
          ? `${styles.accountConnection} ${styles.connected}`
          : styles.accountConnection
      }
    >
      <div className={styles.pinterestLogo}>
        <svg className={styles.pinterestSvg} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10c-22.1 0-40 17.9-40 40 0 16.8 10.4 31.2 25.1 37.1-.3-3.2-.7-8.1.1-11.6.7-3.2 4.1-17.5 4.1-17.5s-1.1-2.1-1.1-5.2c0-4.9 2.8-8.5 6.4-8.5 3 0 4.5 2.3 4.5 5 0 3-1.9 7.6-2.9 11.8-.8 3.5 1.8 6.4 5.2 6.4 6.3 0 11.1-6.6 11.1-16.2 0-8.5-6.1-14.4-14.8-14.4-10.1 0-16 7.6-16 15.4 0 3.1 1.2 6.3 2.6 8.1.3.4.3.7.2 1-.3 1.1-.9 3.4-1 3.9-.2.6-.5.8-1.1.5-4.2-2-6.9-8.2-6.9-13.1 0-10.7 7.8-20.5 22.4-20.5 11.8 0 20.9 8.4 20.9 19.6 0 11.7-7.4 21.1-17.6 21.1-3.4 0-6.7-1.8-7.8-3.9l-2.1 8.1c-.8 2.9-2.8 6.6-4.2 8.9 3.2 1 6.5 1.5 10 1.5 22.1 0 40-17.9 40-40S72.1 10 50 10z" fill="white"/>
        </svg>
      </div>
      <div className={styles.connectionText}>
        <div className={styles.connectionTitle}>Pinterest</div>
        <div className={
          pinterestConnected
            ? `${styles.connectionStatusText} ${styles.connected}`
            : styles.connectionStatusText
        }>
          {pinterestConnected ? 'Connected ✓' : 'Click to connect'}
        </div>
      </div>
      {pinterestConnected && (
        <button className={styles.disconnectBtn} onClick={onDisconnectPinterest}>
          Disconnect
        </button>
      )}
    </div>
    <div className={styles.connectionMixer}>
      <div className={styles.cd}></div>
    </div>
    <div
      className={
        spotifyConnected
          ? `${styles.accountConnection} ${styles.connected}`
          : styles.accountConnection
      }
    >
      <div className={styles.spotifyLogo}>♫</div>
      <div className={styles.connectionText}>
        <div className={styles.connectionTitle}>Spotify</div>
        <div className={
          spotifyConnected
            ? `${styles.connectionStatusText} ${styles.connected}`
            : styles.connectionStatusText
        }>
          {spotifyConnected ? 'Connected ✓' : 'Click to connect'}
        </div>
      </div>
      {spotifyConnected && (
        <button className={styles.disconnectBtn} onClick={onDisconnectSpotify}>
          Disconnect
        </button>
      )}
    </div>
  </div>
);

export default ConnectionStatus; 