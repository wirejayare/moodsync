import React, { useState } from 'react';

const PinterestPanel = ({
  boards = [],
  selectedBoard,
  onBoardSelect,
  onGeneratePlaylist,
  boardPreviews = {},
  isLoading,
  error
}) => {
  const [mode, setMode] = useState('url'); // Default to URL mode
  const [boardUrl, setBoardUrl] = useState('');

  const handleGeneratePlaylist = () => {
    if (mode === 'picker') {
      if (!selectedBoard) {
        alert('Please select a Pinterest board first!');
        return;
      }
      onGeneratePlaylist(selectedBoard);
    } else {
      if (!boardUrl || (!boardUrl.includes('pinterest.com') && !boardUrl.includes('pin.it/'))) {
        alert('Please enter a valid Pinterest board URL or shortlink (pin.it/...)!');
        return;
      }
      onGeneratePlaylist(boardUrl);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '2rem',
      color: 'white'
    }}>
      <h3 style={{ 
        marginBottom: '1rem',
        color: 'white',
        textAlign: 'center'
      }}>
        📌 Pinterest Board Analysis
      </h3>
      
      {/* Mode Selection */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        background: 'rgba(255,255,255,0.1)',
        padding: '8px',
        borderRadius: '8px'
      }}>
        <button
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
        <div>
          {isLoading ? (
            <div>Loading boards...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            <div>
              <select 
                value={selectedBoard || ''} 
                onChange={(e) => onBoardSelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: '14px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#333',
                  marginBottom: '16px'
                }}
              >
                <option value="">Select a board...</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name} ({board.pin_count || board.pinCount} pins)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: 'white', opacity: 0.8 }}>
            💡 <strong>Quick Analysis:</strong> Enter any Pinterest board URL to analyze without connecting your account
          </div>
          <input
            type="url"
            placeholder="https://www.pinterest.com/username/board-name/ or https://pin.it/abc123"
            value={boardUrl}
            onChange={e => setBoardUrl(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.9)',
              color: '#333',
              marginBottom: '16px'
            }}
          />
        </div>
      )}
      
      <button 
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
          cursor: 'pointer'
        }}
      >
        {mode === 'url' ? '🔍 Analyze Board URL' : '🎵 Generate Playlist'}
      </button>
    </div>
  );
};

export default PinterestPanel; 