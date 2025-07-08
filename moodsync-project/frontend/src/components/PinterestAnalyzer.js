// src/components/PinterestAnalyzer.js
import React, { useState } from 'react';

const PinterestAnalyzer = ({ spotifyToken, onAnalysisComplete }) => {
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!pinterestUrl.includes('pinterest.com')) {
      alert('Please enter a valid Pinterest board URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinterestUrl })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        onAnalysisComplete(data.analysis);
      } else {
        alert('Failed to analyze board: ' + data.message);
      }
    } catch (error) {
      alert('Error analyzing board: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>📌 Analyze Pinterest Board</h3>
      
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
            border: 'none',
            fontSize: '16px',
            marginBottom: '1rem'
          }}
        />
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !pinterestUrl}
          style={{
            background: isAnalyzing ? '#ccc' : '#E60023',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Mood'}
        </button>
      </div>

      {analysis && (
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginTop: '1rem'
        }}>
          <h4>🎨 Mood Analysis Results</h4>
          <p><strong>Detected Mood:</strong> {analysis.mood}</p>
          <p><strong>Theme:</strong> {analysis.theme}</p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>{analysis.description}</p>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>Suggested Genres:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {analysis.genres.map((genre, index) => (
                <span
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Color Palette:</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {analysis.colors.map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinterestAnalyzer;
