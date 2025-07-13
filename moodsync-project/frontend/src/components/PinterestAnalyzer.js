// src/components/PinterestAnalyzer.js
import React, { useState } from 'react';

const PinterestAnalyzer = ({ spotifyToken, onAnalysisComplete }) => {
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!pinterestUrl.includes('pinterest.com') && !pinterestUrl.includes('pin.it/')) {
      alert('Please enter a valid Pinterest board URL or shortlink (pin.it/...)');
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
    <div className="card glass animate-fade-in-up" style={{ marginBottom: 'var(--space-xl)' }}>
      <h3 className="heading-3" style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
        📌 Analyze Pinterest Board
      </h3>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <input
          type="url"
          placeholder="https://pinterest.com/username/board-name/ or https://pin.it/abc123"
          value={pinterestUrl}
          onChange={(e) => setPinterestUrl(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-small)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            marginBottom: 'var(--space-md)'
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !pinterestUrl}
          className="btn btn-pinterest"
          style={{
            width: '100%',
            opacity: (!pinterestUrl || isAnalyzing) ? 0.5 : 1,
            cursor: (!pinterestUrl || isAnalyzing) ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Mood'}
        </button>
      </div>

      {analysis && (
        <div className="glass" style={{
          padding: 'var(--space-lg)',
          borderRadius: 'var(--radius-medium)',
          marginTop: 'var(--space-lg)',
          color: 'var(--text-primary)'
        }}>
          <h4 className="heading-3" style={{ marginBottom: 'var(--space-md)' }}>🎨 Mood Analysis Results</h4>
          <div className="body-medium" style={{ marginBottom: 'var(--space-md)' }}>
            <strong>Detected Mood:</strong> {analysis.mood}<br/>
            <strong>Theme:</strong> {analysis.theme}<br/>
            <span style={{ fontSize: '0.95em', color: 'var(--text-secondary)' }}>{analysis.description}</span>
          </div>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <strong>Suggested Genres:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {analysis.genres.map((genre, index) => (
                <span
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.95em',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <strong>Color Palette:</strong>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {analysis.colors.map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
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
