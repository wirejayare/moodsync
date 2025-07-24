// src/components/PinterestBoardSelector.js
import React, { useState, useEffect } from 'react';

const PinterestBoardSelector = ({ 
  pinterestToken, 
  pinterestUser, 
  onBoardSelect,
  selectedBoard 
}) => {
  const [boards, setBoards] = useState([]);
  const [filteredBoards, setFilteredBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [thumbnails, setThumbnails] = useState([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [previewBoard, setPreviewBoard] = useState(null);

  useEffect(() => {
    if (pinterestToken && pinterestUser) {
      fetchUserBoards();
    }
  }, [pinterestToken, pinterestUser]);

  useEffect(() => {
    let filtered = boards.filter(board => 
      board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'pins':
          return b.pin_count - a.pin_count;
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredBoards(filtered);
  }, [boards, searchTerm, sortBy]);

  const fetchUserBoards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards', {
        headers: {
          'Authorization': `Bearer ${pinterestToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setBoards(data.boards);
      } else {
        throw new Error(data.message || 'Failed to fetch boards');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoardClick = async (board) => {
    setPreviewBoard(board);
    setThumbnails([]);
    setLoadingThumbnails(true);
    setError(null);
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards/${board.id}/pins`, {
        headers: {
          'Authorization': `Bearer ${pinterestToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setThumbnails(data.pins.slice(0, 3));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleConfirmBoard = () => {
    if (previewBoard) {
      onBoardSelect({ ...previewBoard, thumbnails });
      setPreviewBoard(null);
      setThumbnails([]);
    }
  };

  if (!pinterestToken || !pinterestUser) return null;

  return (
    <section className="apple-glass pinterest-board-selector" aria-label="Pinterest Board Selector">
      {/* Header Section */}
      <header className="pbs-header">
        <div className="pbs-header-info">
          <h2 className="pbs-title">📌 Select Your Board</h2>
          {selectedBoard ? (
            <div className="pbs-selected" aria-live="polite">
              Selected: {selectedBoard.name} ({selectedBoard.pin_count} pins)
            </div>
          ) : (
            <div className="pbs-subtitle">
              Choose from {boards.length} boards
            </div>
          )}
        </div>
        <button
          className={`pbs-toggle-btn${isExpanded ? ' expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isLoading}
          aria-expanded={isExpanded}
          aria-controls="pbs-board-list"
        >
          {isLoading ? '⏳' : isExpanded ? '▲ Hide' : '▼ Browse'}
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="pbs-error" role="alert">
          Error: {error}
          <button className="pbs-retry" onClick={fetchUserBoards}>
            Retry
          </button>
        </div>
      )}

      {/* Expanded Board Browser */}
      {isExpanded && (
        <div className="pbs-board-browser" id="pbs-board-list">
          {/* Search and Sort Controls */}
          <div className="pbs-controls">
            <input
              type="text"
              className="pbs-search"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search boards"
            />
            <select
              className="pbs-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort boards"
            >
              <option value="name">Sort by Name</option>
              <option value="pins">Sort by Pin Count</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>

          {/* Board Grid Container */}
          <div className="pbs-board-grid">
            {filteredBoards.length === 0 && !isLoading ? (
              <div className="pbs-empty">
                {searchTerm ? `No boards found matching "${searchTerm}"` : 'No boards found. Create some boards on Pinterest first!'}
              </div>
            ) : (
              <div className="pbs-board-list">
                {filteredBoards.map((board) => (
                  <div
                    key={board.id}
                    className={`pbs-board-card${selectedBoard?.id === board.id ? ' selected' : ''}`}
                    onClick={() => handleBoardClick(board)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedBoard?.id === board.id}
                    aria-label={`Select board ${board.name}`}
                  >
                    {/* Board Info */}
                    <div className="pbs-board-info">
                      <div className="pbs-board-name">{board.name}</div>
                      {board.description && (
                        <div className="pbs-board-desc">{board.description}</div>
                      )}
                    </div>
                    {/* Board Stats */}
                    <div className="pbs-board-stats">
                      <span>📌 {board.pin_count} pins</span>
                      <div className="pbs-board-meta">
                        {board.follower_count > 0 && (
                          <span>👥 {board.follower_count}</span>
                        )}
                        {board.privacy === 'private' && (
                          <span>🔒</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Board Preview and Confirm */}
          {previewBoard && (
            <div className="pbs-preview-modal">
              <div className="pbs-preview-header">Preview: {previewBoard.name}</div>
              {loadingThumbnails ? (
                <div className="pbs-thumbnails-loading">Loading thumbnails...</div>
              ) : (
                <div className="pbs-thumbnails">
                  {thumbnails.length > 0 ? (
                    thumbnails.map((thumb, idx) => (
                      <div
                        key={thumb.id || idx}
                        className="pbs-thumb"
                        style={{ backgroundImage: `url(${thumb.image_url})` }}
                        title={thumb.title}
                      />
                    ))
                  ) : (
                    <div className="pbs-thumb-empty">No thumbnails found</div>
                  )}
                </div>
              )}
              <button className="pbs-confirm-btn" onClick={handleConfirmBoard} disabled={loadingThumbnails}>
                {loadingThumbnails ? 'Loading...' : 'Create Playlist'}
              </button>
              <button className="pbs-cancel-btn" onClick={() => { setPreviewBoard(null); setThumbnails([]); }}>
                Cancel
              </button>
            </div>
          )}
          {/* Stats Footer */}
          {filteredBoards.length > 0 && (
            <div className="pbs-footer">
              Showing {filteredBoards.length} of {boards.length} boards
            </div>
          )}
        </div>
      )}

      {/* Selected Board Display */}
      {selectedBoard && (
        <div className="pbs-selected-board">
          <div className="pbs-selected-title">
            ✅ Ready to Analyze: {selectedBoard.name}
          </div>
          <div className="pbs-selected-grid">
            <div>📌 {selectedBoard.pin_count} pins</div>
            <div>👥 {selectedBoard.follower_count} followers</div>
            <div>{selectedBoard.privacy === 'private' ? '🔒 Private' : '🔓 Public'}</div>
            <div>👤 @{selectedBoard.owner?.username}</div>
          </div>
          {selectedBoard.description && (
            <div className="pbs-selected-desc">
              "{selectedBoard.description}"
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PinterestBoardSelector;
