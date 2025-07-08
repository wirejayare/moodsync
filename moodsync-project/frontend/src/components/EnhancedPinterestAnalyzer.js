// src/components/EnhancedAnalysisDisplay.js - Safe version with error handling
import React from 'react';

const EnhancedAnalysisDisplay = ({ analysis }) => {
  // Add safety checks
  if (!analysis) {
    console.log('No analysis data provided');
    return null;
  }

  console.log('Analysis data received:', analysis);

  try {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '2rem',
        borderRadius: '15px',
        marginTop: '1rem'
      }}>
        <h4 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          🎨 Comprehensive Mood Analysis
        </h4>

        {/* Primary Mood Section - with safety checks */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h5>🎭 Primary Mood</h5>
            <div style={{
              background: 'rgba(255,255,255,0.3)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px'
            }}>
              {Math.round((analysis.mood?.confidence || 0) * 100)}% confidence
            </div>
          </div>
          
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {analysis.mood?.primary || analysis.mood || 'Unknown'}
          </div>
          
          {analysis.mood?.secondary && Array.isArray(analysis.mood.secondary) && (
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Secondary moods: {analysis.mood.secondary.join(', ')}
            </div>
          )}

          {/* Emotional Spectrum - with safety checks */}
          {analysis.mood?.emotional_spectrum && Array.isArray(analysis.mood.emotional_spectrum) && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                Emotional Spectrum:
              </div>
              {analysis.mood.emotional_spectrum.slice(0, 5).map((mood, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '12px'
                }}>
                  <span style={{ minWidth: '80px' }}>{mood.name || 'Unknown'}</span>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '3px',
                    marginLeft: '8px',
                    marginRight: '8px'
                  }}>
                    <div style={{
                      width: `${(mood.confidence || 0) * 100}%`,
                      height: '100%',
                      background: `hsl(${120 * (mood.confidence || 0)}, 70%, 60%)`,
                      borderRadius: '3px'
                    }} />
                  </div>
                  <span>{Math.round((mood.confidence || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual Analysis Section - with safety checks */}
        {analysis.visual && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <h5 style={{ marginBottom: '1rem' }}>👁️ Visual Analysis</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Color Palette */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Color Palette
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {analysis.visual.color_palette && Array.isArray(analysis.visual.color_palette) && 
                    analysis.visual.color_palette.slice(0, 8).map((color, index) => (
                    <div
                      key={index}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color.hex || color || '#ccc',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        position: 'relative'
                      }}
                      title={`${color.hex || color} - ${color.mood || ''}`}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Temperature: {analysis.visual.color_temperature || 'Unknown'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Harmony: {analysis.visual.color_harmony || 'Unknown'}
                </div>
              </div>

              {/* Style Analysis */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Style & Composition
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <div>Aesthetic: {analysis.visual.aesthetic_style || 'Unknown'}</div>
                  <div>Complexity: {analysis.visual.visual_complexity || 'Unknown'}</div>
                  <div>Lighting: {analysis.visual.lighting_mood || 'Unknown'}</div>
                  <div>Composition: {analysis.visual.composition_style || 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Music Recommendation Insights - with safety checks */}
        {analysis.music && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '10px'
          }}>
            <h5 style={{ marginBottom: '1rem' }}>🎵 Music Recommendations</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Genres */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Suggested Genres
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {analysis.music.primary_genres && Array.isArray(analysis.music.primary_genres) && 
                    analysis.music.primary_genres.map((genre, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(29, 185, 84, 0.3)',
                        border: '1px solid rgba(29, 185, 84, 0.5)',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '12px'
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Energy & Style */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Musical Characteristics
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <div>Energy Level: {analysis.music.energy_level || 'Unknown'}</div>
                  <div>Tempo Range: {analysis.music.tempo_range || 'Unknown'}</div>
                  <div>Style: {analysis.music.vocal_style || 'Unknown'}</div>
                  <div>Era: {analysis.music.era_preference || 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple fallback for basic analysis */}
        {!analysis.mood?.primary && analysis.mood && typeof analysis.mood === 'string' && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <h5>🎭 Detected Mood</h5>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {analysis.mood}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              {analysis.description || 'Mood-based analysis completed'}
            </div>
            
            {analysis.genres && Array.isArray(analysis.genres) && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Suggested Genres:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {analysis.genres.map((genre, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(29, 185, 84, 0.3)',
                        border: '1px solid rgba(29, 185, 84, 0.5)',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '12px'
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug info */}
        <div style={{
          marginTop: '1rem',
          fontSize: '12px',
          opacity: 0.5,
          textAlign: 'center'
        }}>
          Analysis type: {analysis.mood?.primary ? 'Enhanced' : 'Basic'} • 
          Data keys: {Object.keys(analysis).join(', ')}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering analysis display:', error);
    return (
      <div style={{
        background: 'rgba(255,100,100,0.2)',
        padding: '2rem',
        borderRadius: '15px',
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        <h4>⚠️ Display Error</h4>
        <p>There was an error displaying the analysis results.</p>
        <details style={{ marginTop: '1rem', fontSize: '12px' }}>
          <summary>Debug Info</summary>
          <pre style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
};

export default EnhancedAnalysisDisplay;
