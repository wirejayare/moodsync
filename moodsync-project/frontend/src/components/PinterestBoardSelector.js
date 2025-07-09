// src/components/PinterestBoardSelector.js
import React, { useState, useEffect } from 'react';

const PinterestBoardSelector = ({ 
  pinterestToken, 
  pinterestUser, 
  onBoardSelect,
  selectedBoard 
}) => {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (pinterestToken && pinterestUser) {
      fetchUserBoards();
    }
  }, [pinterestToken, pinterestUser]);

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
        console.log(`Loaded ${data.boards.length} boards`);
      } else {
        throw new Error(data.message || 'Failed to fetch boards');
      }
      
    } catch (error) {
      console.error('Error fetching boards:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoardClick = async (board) => {
    try {
      setIsLoading(true);
      
      // Fetch detailed board info
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards/${board.id}`, {
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
        onBoardSelect(data.board);
        setIsExpanded(false);
      } else {
        throw new Error(data.message || 'Failed to fetch board details');
      }
      
    } catch (error) {
      console.error('Error fetching board details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pinterestToken || !pinterestUser) {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(230, 0, 35, 0.1)',
      border: '2px solid rgba(230, 0, 35, 0.3)',
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '1rem'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isExpanded ? '1rem' : '0'
      }}>
        <div>
          <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
            📌 Select Your Board
          </div>
          {selectedBoard ? (
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.9 }}>
              Selected: {selectedBoard.name} ({selectedBoard.pin_count} pins)
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.7 }}>
              Choose a board to analyze
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isLoading}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '⏳' : isExpanded ? '▲ Hide' : '▼ Browse'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 53, 69, 0.2)',
          border: '1px solid rgba(220, 53, 69, 0.4)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '1rem'
        }}>
          Error: {error}
          <button
            onClick={fetchUserBoards}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isExpanded && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '8px'
        }}>
          {boards.length === 0 && !isLoading ? (
            <div style={{
              textAlign: 'center',
              color: 'white',
              opacity: 0.7,
              padding: '2rem'
            }}>
              No boards found. Create some boards on Pinterest first!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => handleBoardClick(board)}
                  style={{
                    background: selectedBoard?.id === board.id ? 
                      'rgba(230, 0, 35, 0.3)' : 'rgba(255,255,255,0.1)',
                    border: selectedBoard?.id === board.id ? 
                      '2px solid rgba(230, 0, 35, 0.6)' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBoard?.id !== board.id) {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBoard?.id !== board.id) {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                >
                  <div>
                    <div style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {board.name}
                    </div>
                    
                    {board.description && (
                      <div style={{
                        color: 'white',
                        opacity: 0.8,
                        fontSize: '12px',
                        lineHeight: '1.3',
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {board.description}
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'white',
                    opacity: 0.7
                  }}>
                    <span>📌 {board.pin_count} pins</span>
                    {board.privacy === 'private' && (
                      <span>🔒 Private</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedBoard && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            ✅ Ready to Analyze: {selectedBoard.name}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '8px',
            fontSize: '12px',
            color: 'white',
            opacity: 0.9
          }}>
            <div>📌 {selectedBoard.pin_count} pins</div>
            <div>👥 {selectedBoard.follower_count} followers</div>
            <div>🔓 {selectedBoard.privacy}</div>
            <div>👤 @{selectedBoard.owner?.username}</div>
          </div>
          
          {selectedBoard.description && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'white',
              opacity: 0.8,
              fontStyle: 'italic'
            }}>
              "{selectedBoard.description}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PinterestBoardSelector;
