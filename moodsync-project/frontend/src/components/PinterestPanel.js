import React, { useState } from 'react';
import styles from './PinterestPanel.module.css';

const PinterestPanel = ({
  boards = [],
  selectedBoard,
  onBoardSelect,
  onGeneratePlaylist,
  boardPreviews = {},
  isLoading,
  error
}) => {
  const [mode, setMode] = useState('url'); // Default to URL mode for easier access
  const [boardUrl, setBoardUrl] = useState('');

  const handleBoardChange = (e) => {
    onBoardSelect(e.target.value);
  };

  const handleGeneratePlaylist = () => {
    if (mode === 'picker') {
      if (!selectedBoard) {
        alert('Please select a Pinterest board first!');
        return;
      }
      onGeneratePlaylist(selectedBoard);
    } else {
      if (!boardUrl || !boardUrl.includes('pinterest.com')) {
        alert('Please enter a valid Pinterest board URL!');
        return;
      }
      onGeneratePlaylist(boardUrl);
    }
  };

  // Find the selected board object
  const selectedBoardObj = boards.find(b => b.id === selectedBoard);

  // Render pin preview row for a board
  const renderPinPreviewRow = (board) => {
    if (!board.thumbnails || board.thumbnails.length === 0) return null;
    return (
      <div className={styles.pinPreviewRow}>
        {board.thumbnails.slice(0, 3).map((pin, idx) => (
          <img
            key={idx}
            src={pin.image_url}
            alt={`Pin ${idx + 1}`}
            className={styles.pinPreviewImg}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>📌 Pinterest Board Analysis</div>
      
      {/* Mode Selection with better styling */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 16,
        background: 'rgba(255,255,255,0.1)',
        padding: '8px',
        borderRadius: '8px'
      }}>
        <button
          className={mode === 'picker' ? styles.modeBtnActive : styles.modeBtn}
          onClick={() => setMode('picker')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: mode === 'picker' ? '#E60023' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📋 Your Boards
        </button>
        <button
          className={mode === 'url' ? styles.modeBtnActive : styles.modeBtn}
          onClick={() => setMode('url')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: mode === 'url' ? '#667eea' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔗 Board URL
        </button>
      </div>
      
      {mode === 'picker' ? (
        <div className={styles.boardSelector}>
          {isLoading ? (
            <div>Loading boards...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            <>
              {/* Custom board picker with pin previews */}
              <div className={styles.boardPickerList}>
                {boards.map(board => (
                  <div
                    key={board.id}
                    className={
                      board.id === selectedBoard
                        ? `${styles.boardPickerItem} ${styles.selected}`
                        : styles.boardPickerItem
                    }
                    onClick={() => onBoardSelect(board.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={board.id === selectedBoard}
                  >
                    {renderPinPreviewRow(board)}
                    <span className={styles.boardPickerName}>{board.name} ({board.pin_count || board.pinCount} pins)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className={styles.urlInputSection}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: 'white', opacity: 0.8 }}>
            💡 <strong>Quick Analysis:</strong> Enter any Pinterest board URL to analyze without connecting your account
          </div>
          <input
            type="url"
            className={styles.urlInput}
            placeholder="https://www.pinterest.com/username/board-name/"
            value={boardUrl}
            onChange={e => setBoardUrl(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.9)',
              color: '#333'
            }}
          />
        </div>
      )}
      
      <button 
        className={styles.btn} 
        onClick={handleGeneratePlaylist}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          background: mode === 'url' ? '#667eea' : '#E60023',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '16px'
        }}
      >
        {mode === 'url' ? '🔍 Analyze Board URL' : '🎵 Generate Playlist'}
      </button>
    </div>
  );
};

export default PinterestPanel; 