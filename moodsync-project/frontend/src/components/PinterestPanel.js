import React from 'react';
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
  const handleBoardChange = (e) => {
    onBoardSelect(e.target.value);
  };

  const handleGeneratePlaylist = () => {
    if (!selectedBoard) {
      alert('Please select a Pinterest board first!');
      return;
    }
    onGeneratePlaylist(selectedBoard);
  };

  // Find the selected board object
  const selectedBoardObj = boards.find(b => b.id === selectedBoard);

  // Render pin preview row for a board
  const renderPinPreviewRow = (board) => {
    if (!board.pins || board.pins.length === 0) return null;
    return (
      <div className={styles.pinPreviewRow}>
        {board.pins.slice(0, 3).map((pin, idx) => (
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