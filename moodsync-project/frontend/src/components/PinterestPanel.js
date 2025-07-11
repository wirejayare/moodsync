import React from 'react';
import styles from './PinterestPanel.module.css';

const PinterestPanel = ({
  boards = [],
  selectedBoard,
  onBoardSelect,
  onGeneratePlaylist,
  boardPreviews = {}
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

  const renderBoardPreview = () => {
    if (!selectedBoard || !boardPreviews[selectedBoard]) {
      return (
        <>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>Select</div>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>a board</div>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>to see</div>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>preview</div>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>of your</div>
          <div className={styles.boardItem} style={{ opacity: 0.3 }}>pins</div>
        </>
      );
    }

    return boardPreviews[selectedBoard].map((pin, index) => (
      <div
        key={index}
        className={styles.boardItem}
        style={{ backgroundImage: pin.style }}
      >
        <span>{pin.text}</span>
      </div>
    ));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>📌 Your Pinterest Board</div>
      
      <div className={styles.boardSelector}>
        <select
          className={styles.boardDropdown}
          value={selectedBoard || ''}
          onChange={handleBoardChange}
        >
          <option value="">Select a Pinterest board...</option>
          {boards.map(board => (
            <option key={board.id} value={board.id}>
              {board.name} ({board.pinCount} pins)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.boardPreviewLabel}>Board Preview</div>
      <div className={styles.boardGrid}>
        {renderBoardPreview()}
      </div>
      
      <button className={styles.btn} onClick={handleGeneratePlaylist}>
        Generate Playlist
      </button>
    </div>
  );
};

export default PinterestPanel; 