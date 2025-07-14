import React, { useState, useEffect } from 'react';
import PlaylistCreator from './PlaylistCreator';
import PinterestConnector from './PinterestConnector';
import LiquidText from './LiquidText';

const Home = ({ 
  spotifyUser, 
  spotifyToken, 
  onSpotifyAuth,
  pinterestUser,
  pinterestToken,
  onPinterestAuth,
  onLogout
}) => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [analysis, setAnalysis] = useState(null);
  const [pinterestBoards, setPinterestBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [pinterestError, setPinterestError] = useState(null);
  const [boardUrl, setBoardUrl] = useState(''); // New state for board URL
  const [mode, setMode] = useState('picker'); // 'picker' or 'url'
  const [createdPlaylist, setCreatedPlaylist] = useState(null); // New state for created playlist
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #222 0%, #333 100%)');
  const [liquidLayers, setLiquidLayers] = useState([
    { gradient: 'linear-gradient(135deg, #39ff14 0%, #330000 50%, #1a1a1a 100%)', opacity: 1, transform: 'scale(1) rotate(0deg)' },
    { gradient: 'linear-gradient(45deg, #2d0000 0%, #4d0000 50%, #2d2d2d 100%)', opacity: 0.7, transform: 'scale(1.1) rotate(5deg)' },
    { gradient: 'linear-gradient(225deg, #000000 0%, #1a0000 50%, #404040 100%)', opacity: 0.5, transform: 'scale(1.2) rotate(-3deg)' }
  ]);

  useEffect(() => {
    // Test backend connection
    fetch(`https://moodsync-backend-sdbe.onrender.com/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('✅ Connected'))
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  // Fetch boards if Pinterest is connected
  useEffect(() => {
    if (pinterestToken && pinterestUser) {
      setIsLoadingBoards(true);
      setPinterestError(null);
      fetch('https://moodsync-backend-sdbe.onrender.com/api/pinterest/boards', {
        headers: {
          'Authorization': `Bearer ${pinterestToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPinterestBoards(data.boards);
          } else {
            setPinterestError(data.message || 'Failed to fetch boards');
          }
        })
        .catch(err => setPinterestError(err.message))
        .finally(() => setIsLoadingBoards(false));
    } else {
      setPinterestBoards([]);
      setSelectedBoard(null);
    }
  }, [pinterestToken, pinterestUser]);

  // Handler for board selection
  const handleBoardSelect = (boardId) => {
    setSelectedBoard(boardId);
  };

  // Handler for board selection (alias for consistency)
  const onBoardSelect = (boardId) => {
    setSelectedBoard(boardId);
  };

  // Handler for playlist generation (boardId or boardUrl)
  const handleGeneratePlaylist = async (boardOrUrl) => {
    setAnalysis(null);
    let analysisData = null;
    
    try {
      if (typeof boardOrUrl === 'string' && (boardOrUrl.includes('pinterest.com') || boardOrUrl.includes('pin.it/'))) {
        // Board URL mode
        console.log('🔍 Sending URL analysis request:', boardOrUrl);
        const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: boardOrUrl })
        });
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📡 Response data:', data);
        if (data.success) {
          analysisData = data.analysis;
        } else {
          throw new Error(data.message || 'Analysis failed');
        }
      } else {
        // Board picker mode
        const board = pinterestBoards.find(b => b.id === boardOrUrl);
        if (!board) throw new Error('Board not found');
        const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-with-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardId: board.id, pinterestToken })
        });
        const data = await response.json();
        if (data.success) {
          analysisData = data.analysis;
        } else {
          throw new Error(data.message || 'Analysis failed');
        }
      }
      
      // Set analysis first
      setAnalysis(analysisData);
      
      // Then automatically generate preview
      await handleAutoGeneratePreview(analysisData);
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        boardOrUrl: boardOrUrl
      });
      alert('Failed to analyze board: ' + error.message);
    }
  };

  // Auto-generate playlist preview
  const handleAutoGeneratePreview = async (analysisData) => {
    try {
      console.log('🎵 Auto-generating playlist preview...');
      console.log('📊 Analysis data for preview:', analysisData);
      
      const requestBody = {
        accessToken: null, // No Spotify token for preview
        analysis: analysisData,
        playlistName: `${analysisData.mood?.primary || 'Mood'} Vibes`
      };
      
      console.log('📤 Sending preview request:', requestBody);
      
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Preview response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Preview generation failed:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('✅ Auto-generated preview response:', data);
      
      if (data.success && data.playlist) {
        console.log('🎉 Preview generated successfully:', data.playlist);
        // Update analysis with preview data
        setAnalysis(prevAnalysis => ({
          ...prevAnalysis,
          autoPreview: data.playlist
        }));
      } else {
        console.error('❌ Preview generation failed - no playlist in response:', data);
      }
      
    } catch (error) {
      console.error('❌ Auto-preview generation error:', error);
    }
  };

  // Check for restored analysis and playlist after OAuth
  React.useEffect(() => {
    const restoredAnalysis = localStorage.getItem('moodsync_analysis');
    const createdPlaylist = localStorage.getItem('moodsync_created_playlist');
    
    if (restoredAnalysis && createdPlaylist && !analysis) {
      console.log('🔄 Restoring analysis and playlist after OAuth');
      try {
        const analysisData = JSON.parse(restoredAnalysis);
        const playlistData = JSON.parse(createdPlaylist);
        
        // Set the analysis with the created playlist
        setAnalysis({
          ...analysisData,
          autoPreview: playlistData
        });
        
        // Clear the stored data
        localStorage.removeItem('moodsync_analysis');
        localStorage.removeItem('moodsync_created_playlist');
        
        console.log('✅ Successfully restored analysis and playlist');
      } catch (error) {
        console.error('Error restoring analysis:', error);
        localStorage.removeItem('moodsync_analysis');
        localStorage.removeItem('moodsync_created_playlist');
      }
    }
  }, [analysis]);

  // Liquid morphing animation when analysis changes
  useEffect(() => {
    if (analysis && analysis.visual && analysis.visual.color_palette && analysis.visual.color_palette.length > 0) {
      // Extract colors and create liquid morphing effect
      const colors = analysis.visual.color_palette.slice(0, 4).map(c => c.hex);
      
      // Create multiple gradient layers with different rotations and scales
      const newLayers = [
        {
          gradient: `linear-gradient(${45 + Math.random() * 30}deg, ${colors.join(', ')})`,
          opacity: 1,
          transform: `scale(${1 + Math.random() * 0.2}) rotate(${Math.random() * 10 - 5}deg)`
        },
        {
          gradient: `linear-gradient(${135 + Math.random() * 30}deg, ${colors.reverse().join(', ')})`,
          opacity: 0.7,
          transform: `scale(${1.1 + Math.random() * 0.2}) rotate(${Math.random() * 10 - 5}deg)`
        },
        {
          gradient: `linear-gradient(${225 + Math.random() * 30}deg, ${colors.slice().reverse().join(', ')})`,
          opacity: 0.5,
          transform: `scale(${1.2 + Math.random() * 0.2}) rotate(${Math.random() * 10 - 5}deg)`
        }
      ];
      
      setLiquidLayers(newLayers);
    }
  }, [analysis]);

  const handleSpotifyAuth = async () => {
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleAnalysisComplete = (analysisData) => {
    setAnalysis(analysisData);
  };

  return (
    <main className="home-bg" aria-label="MoodSync Home" style={{
      background: bgGradient,
      transition: 'background 1.5s cubic-bezier(0.4,0,0.2,1)'
    }}>
      <div className="home-container">
        {/* Liquid morphing background layers */}
        <div className="liquid-bg-container">
          {liquidLayers.map((layer, index) => (
            <div
              key={index}
              className="liquid-bg-layer"
              style={{
                background: layer.gradient,
                opacity: layer.opacity,
                transform: layer.transform,
                filter: `blur(${index * 2}px)`,
                transition: `all 2s cubic-bezier(0.4, 0, 0.2, 1)`
              }}
            />
          ))}
        </div>
        
        <LiquidText className="home-title">
          MOODBOARD<br />
          MIXTAPE
        </LiquidText>
        
        <p className="home-subtitle">
          Transform Pinterest moodboards into Spotify playlists
        </p>
        {/* System Status */}
        <section className="apple-glass home-status" aria-label="System Status">
          <h3 className="home-status-title">System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Spotify:</strong> {spotifyUser ? `✅ ${spotifyUser.display_name}` : '❌ Not connected'}</p>
          <p><strong>Pinterest:</strong> {pinterestUser ? `✅ @${pinterestUser.username}` : '❌ Not connected'}</p>
          {pinterestUser && (
            <div className="home-enhanced-status">
              🚀 Enhanced analysis enabled!
            </div>
          )}
        </section>
        {/* Pinterest Analysis Section - Consolidated */}
        <section className="home-analyzer-section">
          <h3 className="home-step-title">📌 Pinterest Board Analysis</h3>
          
          {/* Toggle between Your Boards and Board URL */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '2rem',
            borderRadius: '15px',
            marginBottom: '2rem',
            color: 'white'
          }}>
            
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
                {!pinterestUser ? (
                  // Not connected - Show simple connect button
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                      Connect to Pinterest to choose from your boards
                    </p>
                    <PinterestConnector 
                      onPinterestAuth={onPinterestAuth}
                      pinterestUser={pinterestUser}
                    />
                  </div>
                ) : (
                  // Connected - Show board picker
                  <div>
                    {isLoadingBoards ? (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>Loading boards...</div>
                    ) : pinterestError ? (
                      <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '1rem' }}>Error: {pinterestError}</div>
                    ) : (
                      <div>
                        <select 
                          value={selectedBoard || ''} 
                          onChange={(e) => handleBoardSelect(e.target.value)}
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
                          {pinterestBoards.map(board => (
                            <option key={board.id} value={board.id}>
                              {board.name} ({board.pin_count || board.pinCount} pins)
                            </option>
                          ))}
                        </select>
                        
                        <button 
                          onClick={() => handleGeneratePlaylist(selectedBoard)}
                          disabled={!selectedBoard}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: selectedBoard ? '#E60023' : 'rgba(255,255,255,0.3)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: selectedBoard ? 'pointer' : 'not-allowed',
                            opacity: selectedBoard ? 1 : 0.6
                          }}
                        >
                          🎵 Generate Playlist
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
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
                
                <button 
                  onClick={() => handleGeneratePlaylist(boardUrl)}
                  disabled={!boardUrl || (!boardUrl.includes('pinterest.com') && !boardUrl.includes('pin.it/'))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (boardUrl && (boardUrl.includes('pinterest.com') || boardUrl.includes('pin.it/'))) ? '#667eea' : 'rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: (boardUrl && (boardUrl.includes('pinterest.com') || boardUrl.includes('pin.it/'))) ? 'pointer' : 'not-allowed',
                    opacity: (boardUrl && (boardUrl.includes('pinterest.com') || boardUrl.includes('pin.it/'))) ? 1 : 0.6
                  }}
                >
                  🔍 Analyze Board URL
                </button>
              </div>
            )}
          </div>
          
          {/* Analysis Results Display */}
          {analysis && (
            <section className="apple-glass home-analysis-results" aria-label="Analysis Results">
              {/* AI Reasoning Display */}
              {analysis.music && analysis.music.ai_reasoning && analysis.music.ai_reasoning.length > 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    🧠 AI Reasoning
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}>
                    {analysis.music.ai_reasoning.map((reason, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '0.95rem',
                        lineHeight: '1.4'
                      }}>
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <p>No AI reasoning available for this analysis.</p>
                </div>
              )}
            </section>
          )}
        </section>

        {/* Services Connected - Only show if user is connected */}
        {spotifyUser && (
          <section className="apple-glass home-services-connected" aria-label="Services Connected">
            <h3 className="home-status-title">🎉 Services Connected!</h3>
            <div className="home-service-row">
              <span><strong>Spotify:</strong> {spotifyUser.display_name}</span>
              <button 
                className="btn btn-secondary home-disconnect-btn"
                onClick={() => onLogout('spotify')}
              >
                Disconnect
              </button>
            </div>
            {pinterestUser && (
              <div className="home-service-row">
                <span><strong>Pinterest:</strong> @{pinterestUser.username}</span>
                <button 
                  className="btn btn-secondary home-disconnect-btn"
                  onClick={() => onLogout('pinterest')}
                >
                  Disconnect
                </button>
              </div>
            )}
          </section>
        )}
        
        {/* Playlist Creator - Show for both connected and not connected users */}
        {analysis && (
          <PlaylistCreator 
            spotifyToken={spotifyToken}
            analysis={analysis}
            spotifyUser={spotifyUser}
            onSpotifyAuth={handleSpotifyAuth}
          />
        )}
        <p className="home-flow-desc">
          🚀 Pinterest {pinterestUser ? '+ API' : ''} → AI Analysis → Spotify Playlist
        </p>
      </div>
    </main>
  );
};

export default Home;
