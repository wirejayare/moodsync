import React from 'react';
import styles from './StatusBar.module.css';

const StatusBar = ({
  statusText = 'Ready to generate playlist',
  progress = 0,
  isVisible = false
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusText}>{statusText}</div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className={styles.statusText}>{Math.round(progress)}% Complete</div>
    </div>
  );
};

export default StatusBar; 