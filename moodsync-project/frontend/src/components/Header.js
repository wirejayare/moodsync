import React from 'react';
import styles from './Header.module.css';

const Header = () => (
  <div className={styles.header}>
    <div className={styles.headerContent}>
      <div className={styles.logo}>Moodboard Mixtape</div>
      <div className={styles.tagline}>See the board. Hear the vibe.</div>
    </div>
  </div>
);

export default Header; 