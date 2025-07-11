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
  const [mode, setMode] = useState('picker'); // 'picker' or 'url'
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
      <div className={styles.panelTitle}>📌 Your Pinterest Board</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          className={mode === 'picker' ? styles.modeBtnActive : styles.modeBtn}
          onClick={() => setMode('picker')}
        >
          Board Picker
        </button>
        <button
          className={mode === 'url' ? styles.modeBtnActive : styles.modeBtn}
          onClick={() => setMode('url')}
        >
          Enter Board URL
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
          <input
            type="url"
            className={styles.urlInput}
            placeholder="https://www.pinterest.com/username/board-name/"
            value={boardUrl}
            onChange={e => setBoardUrl(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
          />
        </div>
      )}
      <div className={styles.boardPreviewLabel}>Board Preview</div>
      <div className={styles.boardGrid}>
        {/* Existing preview logic can remain for now */}
        {/* Optionally, show selected board's pins here too */}
      </div>
      <button className={styles.btn} onClick={handleGeneratePlaylist}>
        Generate Playlist
      </button>
    </div>
  );
};

export default PinterestPanel; 