import React, { useState } from 'react';
import EnhancedAnalysisDisplay from './EnhancedAnalysisDisplay';
import VisionAnalysisDisplay from './VisionAnalysisDisplay';
import PinterestConnector from './PinterestConnector';
import PinterestBoardSelector from './PinterestBoardSelector';

const EnhancedPinterestAnalyzer = ({ 
  spotifyToken, 
  onAnalysisComplete, 
  pinterestToken, 
  pinterestUser, 
  onPinterestAuth 
}) => {
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisMode, setAnalysisMode] = useState('url'); // 'url' or 'board'

  const handleAnalyzeUrl = async () => {
    if (!pinterestUrl.includes('pinterest.com')) {
      alert('Please enter a valid Pinterest board URL');
      return;
    }

    // Set loading state immediately
    setIsAnalyzing(true);
    setAnalysisStage('Initializing analysis...');
    
    // Small delay to show immediate feedback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setAnalysisStage(pinterestToken ? 
      'Analyzing Pinterest board with API...' : 
      'Analyzing Pinterest board URL...'
    );
    
    try {
      const endpoint = pinterestToken ? 
        '/api/analyze-pinterest-with-api' : 
        '/api/analyze-pinterest-enhanced';
      
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: pinterestUrl,
          pinterestToken: pinterestToken,
          analysisOptions: {
            enableAPIAnalysis: !!pinterestToken,
            maxPinsToAnalyze: 50
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Analysis method used:', data.method);
        setAnalysis(data.analysis);
        onAnalysisComplete(data.analysis);
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Failed to analyze board: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  const handleAnalyzeBoard = async () => {
    if (!selectedBoard) {
      alert('Please select a board first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('Analyzing your Pinterest board with full API access...');
    
    try {
      const response = await fetch('https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-with-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          boardId: selectedBoard.id,
          pinterestToken: pinterestToken
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Board analysis completed:', data.method);
        setAnalysis(data.analysis);
        onAnalysisComplete(data.analysis);
      } else {
        throw new Error(data.message || 'Board analysis failed');
      }
      
    } catch (error) {
      console.error('Board analysis error:', error);
      alert(`Failed to analyze board: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };
  
  const handleDemoAnalysis = () => {
    const demoAnalysis = {
      mood: {
        primary: 'Energetic',
        confidence: 0.92,
        secondary: ['Fresh', 'Optimistic'],
        emotional_spectrum: [
          { name: 'Energetic', confidence: 0.92 },
          { name: 'Fresh', confidence: 0.78 },
          { name: 'Optimistic', confidence: 0.71 },
          { name: 'Cozy', confidence: 0.45 },
          { name: 'Peaceful', confidence: 0.32 }
        ]
      },
      visual: {
        color_palette: [
          { hex: '#FFD700', mood: 'golden', name: 'Sunrise Gold' },
          { hex: '#FFA500', mood: 'energetic', name: 'Morning Orange' },
          { hex: '#FFEB3B', mood: 'bright', name: 'Sunny Yellow' },
          { hex: '#FF9800', mood: 'warm', name: 'Amber Glow' },
          { hex: '#FFF8DC', mood: 'soft', name: 'Cream Light' }
        ],
        color_temperature: 'warm',
        color_harmony: 'analogous',
        aesthetic_style: 'morning',
        visual_complexity: 'medium',
        lighting_mood: 'bright'
      },
      content: {
        sentiment: { score: 0.8, label: 'positive' },
        keywords: [
          { word: 'morning', count: 15 },
          { word: 'coffee', count: 12 },
          { word: 'sunrise', count: 10 },
          { word: 'energy', count: 8 },
          { word: 'fresh', count: 7 }
        ],
        topics: ['Lifestyle', 'Wellness', 'Daily Routines', 'Coffee Culture'],
        themes: ['morning', 'energetic', 'lifestyle']
      },
      music: {
        primary_genres: ['indie pop', 'upbeat acoustic', 'folk pop', 'coffee shop', 'morning jazz'],
        energy_level: 'medium-high',
        tempo_range: '90-120 BPM',
        vocal_style: 'contemporary vocals',
        era_preference: 'contemporary'
      },
      board: {
        name: 'Demo Morning Person Vibes',
        url: 'https://pinterest.com/demo/morning-person-vibes',
        pin_count: 47,
        detected_themes: [
          { theme: 'morning', confidence: 0.92 },
          { theme: 'energetic', confidence: 0.78 }
        ],
        primary_theme: 'morning',
        theme_confidence: 0.92
      },
      confidence: 0.89,
      analysis_method: 'demo_analysis'
    };
    
    setAnalysis(demoAnalysis);
    onAnalysisComplete(demoAnalysis);
  };

  const handleBoardSelect = (board) => {
    setSelectedBoard(board);
    setAnalysisMode('board');
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
        📌 Enhanced Pinterest Analysis
      </h3>
      
      {/* Pinterest Connection Component */}
      <PinterestConnector 
        onPinterestAuth={onPinterestAuth}
        pinterestUser={pinterestUser}
      />

      {/* Board Selector - only show if Pinterest is connected */}
      {pinterestToken && pinterestUser && (
        <PinterestBoardSelector
          pinterestToken={pinterestToken}
          pinterestUser={pinterestUser}
          onBoardSelect={handleBoardSelect}
          selectedBoard={selectedBoard}
        />
      )}

      {/* Analysis Mode Tabs */}
      <div style={{
        display: 'flex',
        marginBottom: '1rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '4px'
      }}>
        <button
          onClick={() => setAnalysisMode('board')}
          disabled={!pinterestToken}
          style={{
            flex: 1,
            background: analysisMode === 'board' ? 'rgba(230, 0, 35, 0.6)' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: pinterestToken ? 'pointer' : 'not-allowed',
            opacity: pinterestToken ? 1 : 0.5,
            fontWeight: 'bold'
          }}
        >
          📌 Your Boards
        </button>
        <button
          onClick={() => setAnalysisMode('url')}
          style={{
            flex: 1,
            background: analysisMode === 'url' ? 'rgba(102, 126, 234, 0.6)' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔗 URL Analysis
        </button>
      </div>

      {/* Analysis Inputs based on mode */}
      {analysisMode === 'board' ? (
        // Board Analysis Mode
        <div style={{ marginBottom: '1rem' }}>
          {selectedBoard ? (
            <button
              onClick={handleAnalyzeBoard}
              disabled={isAnalyzing}
              style={{
                width: '100%',
                background: isAnalyzing ? '#999' : '#E60023',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isAnalyzing ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {isAnalyzing ? '🔍 Analyzing...' : `🚀 Analyze "${selectedBoard.name}"`}
            </button>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'white',
              opacity: 0.7,
              padding: '2rem',
              border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: '8px'
            }}>
              {pinterestToken ? 
                'Select a board above to analyze' : 
                'Connect Pinterest first to browse your boards'
              }
            </div>
          )}
        </div>
      ) : (
        // URL Analysis Mode
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="url"
            placeholder="https://pinterest.com/username/board-name/"
            value={pinterestUrl}
            onChange={(e) => setPinterestUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '16px',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.9)',
              color: '#333',
              boxSizing: 'border-box'
            }}
          />
          
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleAnalyzeUrl}
              disabled={isAnalyzing || !pinterestUrl}
              style={{
                background: isAnalyzing ? '#999' : (pinterestToken ? '#E60023' : '#667eea'),
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                flex: '1',
                minWidth: '200px',
                opacity: (isAnalyzing || !pinterestUrl) ? 0.6 : 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  🔍 Analyzing...
                </div>
              ) : (
                pinterestToken ? '🚀 Deep API Analysis' : '🔍 Basic Analysis'
              )}
            </button>
            
            <button
              onClick={handleDemoAnalysis}
              disabled={isAnalyzing}
              style={{
                background: '#f39c12',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                minWidth: '80px',
                opacity: isAnalyzing ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              Demo
            </button>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ 
            fontSize: '14px', 
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            {analysisMode === 'board' ? '🤖 Full API Analysis in Progress...' : 
             pinterestToken ? '🤖 AI + API Analysis in Progress...' : '🧠 AI Analysis in Progress...'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.8,
            marginBottom: '8px'
          }}>
            {analysisStage || 'Initializing...'}
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60%',
              height: '100%',
              background: analysisMode === 'board' || pinterestToken ? 
                'linear-gradient(90deg, rgba(230,0,35,0.5), rgba(230,0,35,0.9), rgba(230,0,35,0.5))' :
                'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7), rgba(255,255,255,0.3))',
              borderRadius: '3px',
              animation: 'pulse 1.5s infinite',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* Enhanced Analysis Display */}
      <EnhancedAnalysisDisplay analysis={analysis} />
      
      {/* Vision Analysis Display for detailed breakdown */}
      {analysis && (
        <VisionAnalysisDisplay analysis={analysis} />
      )}

      {/* Analysis Method Indicator */}
      {analysis && (
        <div style={{
          background: analysis.analysis_method === 'pinterest_api_enhanced' ? 
            'rgba(230, 0, 35, 0.1)' : 'rgba(255,255,255,0.05)',
          border: analysis.analysis_method === 'pinterest_api_enhanced' ? 
            '1px solid rgba(230, 0, 35, 0.3)' : '1px solid rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem',
          fontSize: '12px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Analysis Method: {
              analysis.analysis_method === 'pinterest_api_enhanced' ? '🚀 Pinterest API Enhanced' :
              analysis.analysis_method === 'demo_analysis' ? '🎯 Demo Analysis' :
              '📝 Text-Based Analysis'
            }
          </div>
          <div style={{ opacity: 0.8 }}>
            {analysis.analysis_method === 'pinterest_api_enhanced' ? 
              `Analyzed ${analysis.board?.pin_count || 0} pins with full content access` :
              analysis.analysis_method === 'demo_analysis' ? 
              'Sample analysis showing app capabilities' :
              'Connect Pinterest for 10x more accurate results'
            }
          </div>
          {analysis.confidence && (
            <div style={{ opacity: 0.7, marginTop: '4px' }}>
              Confidence: {Math.round(analysis.confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Analysis Features Info */}
      {!analysis && !isAnalyzing && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.4',
          marginTop: '1rem',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: 'white'
          }}>
            {analysisMode === 'board' && pinterestToken ? '🚀 Board Analysis Features:' :
             pinterestToken ? '🚀 API-Enhanced Features:' : '📝 Current Features:'}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '8px',
            color: 'rgba(255,255,255,0.9)'
          }}>
            {analysisMode === 'board' && pinterestToken ? (
              <>
                <div>• Full board content access</div>
                <div>• Individual pin analysis</div>
                <div>• Board description parsing</div>
                <div>• User engagement insights</div>
                <div>• Maximum accuracy (90%+)</div>
                <div>• Real-time Pinterest data</div>
              </>
            ) : pinterestToken ? (
              <>
                <div>• Real pin content analysis</div>
                <div>• Board description parsing</div>
                <div>• Pin engagement data</div>
                <div>• Multi-dimensional mood mapping</div>
                <div>• Enhanced confidence scoring</div>
                <div>• Popularity-validated themes</div>
              </>
            ) : (
              <>
                <div>• URL keyword analysis</div>
                <div>• Advanced color psychology</div>
                <div>• Text sentiment analysis</div>
                <div>• Multi-dimensional mood mapping</div>
                <div>• Enhanced music recommendations</div>
                <div>• Connect Pinterest for 10x better results!</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPinterestAnalyzer;
