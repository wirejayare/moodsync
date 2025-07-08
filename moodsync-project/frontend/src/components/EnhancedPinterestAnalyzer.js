// src/components/EnhancedPinterestAnalyzer.js - Fixed styling
import React, { useState } from 'react';
import EnhancedAnalysisDisplay from './EnhancedAnalysisDisplay';

const EnhancedPinterestAnalyzer = ({ spotifyToken, onAnalysisComplete }) => {
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('');

  const handleAnalyze = async () => {
    if (!pinterestUrl.includes('pinterest.com')) {
      alert('Please enter a valid Pinterest board URL');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('Analyzing Pinterest board...');
    
    try {
      // Start enhanced analysis
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/analyze-pinterest-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: pinterestUrl,  // Fixed parameter name
          analysisOptions: {
            enableComputerVision: true,
            enableTextAnalysis: true,
            enableColorAnalysis: true,
            maxPinsToAnalyze: 20
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle standard JSON response only
      const data = await response.json();
      
      if (data.success) {
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
  
  const handleDemoAnalysis = () => {
    // Demo analysis for testing
    const demoAnalysis = {
      mood: {
        primary: 'Peaceful',
        confidence: 0.87,
        secondary: ['Romantic', 'Cozy'],
        emotional_spectrum: [
          { name: 'Peaceful', confidence: 0.87 },
          { name: 'Romantic', confidence: 0.73 },
          { name: 'Cozy', confidence: 0.68 },
          { name: 'Elegant', confidence: 0.45 },
          { name: 'Fresh', confidence: 0.32 }
        ]
      },
      visual: {
        color_palette: [
          { hex: '#F5E6D3', mood: 'warm' },
          { hex: '#E8C5A0', mood: 'cozy' },
          { hex: '#B8860B', mood: 'earthy' },
          { hex: '#8FBC8F', mood: 'calming' },
          { hex: '#F0F8FF', mood: 'light' }
        ],
        color_temperature: 'warm',
        color_harmony: 'analogous',
        aesthetic_style: 'minimalist',
        visual_complexity: 'low',
        lighting_mood: 'soft',
        composition_style: 'balanced'
      },
      content: {
        sentiment: { score: 0.6, label: 'positive' },
        keywords: [
          { word: 'home', count: 15 },
          { word: 'cozy', count: 12 },
          { word: 'natural', count: 10 },
          { word: 'peaceful', count: 8 },
          { word: 'beautiful', count: 7 }
        ],
        topics: ['Home Decor', 'Interior Design', 'Lifestyle', 'Wellness'],
        themes: ['minimalism', 'hygge', 'natural living']
      },
      music: {
        primary_genres: ['acoustic', 'indie folk', 'ambient', 'classical', 'lo-fi'],
        energy_level: 'low-medium',
        tempo_range: '60-90 BPM',
        vocal_style: 'soft vocals',
        era_preference: 'contemporary'
      },
      board: {
        name: 'Demo Peaceful Home',
        diversity_score: 0.65,
        cohesion_score: 0.82
      }
    };
    
    setAnalysis(demoAnalysis);
    onAnalysisComplete(demoAnalysis);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '2rem',
      color: 'white'  // Ensure text is white
    }}>
      <h3 style={{ 
        marginBottom: '1rem',
        color: 'white',
        textAlign: 'center'
      }}>
        📌 Enhanced Pinterest Analysis
      </h3>
      
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
            background: 'rgba(255,255,255,0.9)',  // Light background for input
            color: '#333',  // Dark text for input
            boxSizing: 'border-box'
          }}
        />
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          flexWrap: 'wrap'  // Allow wrapping on mobile
        }}>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !pinterestUrl}
            style={{
              background: isAnalyzing ? '#999' : '#E60023',
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
              transition: 'all 0.3s ease'
            }}
          >
            {isAnalyzing ? '🔍 Analyzing...' : '🔍 Deep Analysis'}
          </button>
          
          <button
            onClick={handleDemoAnalysis}
            disabled={isAnalyzing}
            style={{
              background: '#667eea',
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
            🧠 AI Analysis in Progress...
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
            {/* Simple pulsing animation */}
            <div style={{
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7), rgba(255,255,255,0.3))',
              borderRadius: '3px'
            }} />
          </div>
        </div>
      )}

      {/* Enhanced Analysis Display */}
      <EnhancedAnalysisDisplay analysis={analysis} />

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
            🚀 Enhanced Analysis Features:
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '8px',
            color: 'rgba(255,255,255,0.9)'
          }}>
            <div>• Computer vision analysis</div>
            <div>• Advanced color psychology</div>
            <div>• Text sentiment analysis</div>
            <div>• Style & composition analysis</div>
            <div>• Multi-dimensional mood mapping</div>
            <div>• Enhanced music recommendations</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPinterestAnalyzer;
