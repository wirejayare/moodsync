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
        console.log(`Loaded ${data.boards.length} boards with thumbnails`);
        
        data.boards.forEach(board => {
          console.log(`Board "${board.name}": ${board.thumbnails?.length || 0} thumbnails`);
          if (board.thumbnails?.length > 0) {
            console.log('Sample thumbnail:', board.thumbnails[0]);
          }
        });
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
      {/* Header Section */}
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
              Choose from {boards.length} boards
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

      {/* Error Display */}
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

      {/* Expanded Board Browser */}
      {isExpanded && (
        <div>
          {/* Search and Sort Controls */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="pins">Sort by Pin Count</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>

          {/* Board Grid Container */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '8px'
          }}>
            {filteredBoards.length === 0 && !isLoading ? (
              <div style={{
                textAlign: 'center',
                color: 'white',
                opacity: 0.7,
                padding: '2rem'
              }}>
                {searchTerm ? `No boards found matching "${searchTerm}"` : 'No boards found. Create some boards on Pinterest first!'}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px'
              }}>
                {filteredBoards.map((board) => (
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
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBoard?.id !== board.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedBoard?.id !== board.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }
                    }}
                  >
                    {/* Board Thumbnails */}
                    {board.thumbnails && board.thumbnails.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '4px',
                        marginBottom: '8px',
                        height: '60px',
                        overflow: 'hidden',
                        borderRadius: '4px'
                      }}>
                        {board.thumbnails.slice(0, 6).map((thumb, index) => (
                          <div
                            key={thumb.id || index}
                            style={{
                              backgroundImage: `url(${thumb.image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: '2px',
                              minHeight: index < 3 ? '28px' : '26px',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                            title={thumb.title}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '60px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        border: '1px dashed rgba(255,255,255,0.3)'
                      }}>
                        <span style={{ fontSize: '20px', opacity: 0.5 }}>📌</span>
                      </div>
                    )}

                    {/* Board Info */}
                    <div style={{ flex: 1 }}>
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
                    
                    {/* Board Stats */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: 'white',
                      opacity: 0.7,
                      marginTop: 'auto'
                    }}>
                      <span>📌 {board.pin_count} pins</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

          {/* Stats Footer */}
          {filteredBoards.length > 0 && (
            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'white',
              opacity: 0.7,
              marginTop: '1rem'
            }}>
              Showing {filteredBoards.length} of {boards.length} boards
            </div>
          )}
        </div>
      )}

      {/* Selected Board Display */}
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
