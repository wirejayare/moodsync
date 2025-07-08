// src/components/EnhancedAnalysisDisplay.js
import React from 'react';

const EnhancedAnalysisDisplay = ({ analysis }) => {
  if (!analysis) return null;

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

      {/* Primary Mood Section */}
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
          {analysis.mood?.primary || 'Unknown'}
        </div>
        
        {analysis.mood?.secondary && (
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Secondary moods: {analysis.mood.secondary.join(', ')}
          </div>
        )}

        {/* Emotional Spectrum */}
        {analysis.mood?.emotional_spectrum && (
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
                <span style={{ minWidth: '80px' }}>{mood.name}</span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  marginLeft: '8px',
                  marginRight: '8px'
                }}>
                  <div style={{
                    width: `${mood.confidence * 100}%`,
                    height: '100%',
                    background: `hsl(${120 * mood.confidence}, 70%, 60%)`,
                    borderRadius: '3px'
                  }} />
                </div>
                <span>{Math.round(mood.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analysis Section */}
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
                {analysis.visual.color_palette?.slice(0, 8).map((color, index) => (
                  <div
                    key={index}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: color.hex || '#ccc',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      position: 'relative'
                    }}
                    title={`${color.hex} - ${color.mood}`}
                  />
                ))}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Temperature: {analysis.visual.color_temperature}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Harmony: {analysis.visual.color_harmony}
              </div>
            </div>

            {/* Style Analysis */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Style & Composition
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div>Aesthetic: {analysis.visual.aesthetic_style}</div>
                <div>Complexity: {analysis.visual.visual_complexity}</div>
                <div>Lighting: {analysis.visual.lighting_mood}</div>
                <div>Composition: {analysis.visual.composition_style}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Analysis Section */}
      {analysis.content && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <h5 style={{ marginBottom: '1rem' }}>📝 Content Analysis</h5>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Sentiment */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Overall Sentiment
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: '8px'
              }}>
                <span style={{
                  fontSize: '16px',
                  marginRight: '8px'
                }}>
                  {analysis.content.sentiment?.label === 'positive' ? '😊' : 
                   analysis.content.sentiment?.label === 'negative' ? '😔' : '😐'}
                </span>
                <span style={{ textTransform: 'capitalize' }}>
                  {analysis.content.sentiment?.label || 'Neutral'}
                </span>
              </div>
            </div>

            {/* Top Keywords */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Key Themes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {analysis.content.keywords?.slice(0, 6).map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  >
                    {keyword.word}
                  </span>
                ))}
              </div>
            </div>

            {/* Topics */}
            {analysis.content.topics && analysis.content.topics.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Content Categories
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {analysis.content.topics.slice(0, 4).map((topic, index) => (
                    <div key={index}>• {topic}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Music Recommendation Insights */}
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
                {analysis.music.primary_genres?.map((genre, index) => (
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
                <div>Energy Level: {analysis.music.energy_level}</div>
                <div>Tempo Range: {analysis.music.tempo_range}</div>
                <div>Style: {analysis.music.vocal_style}</div>
                <div>Era: {analysis.music.era_preference}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board Insights */}
      {analysis.board && (
        <div style={{
          marginTop: '1rem',
          fontSize: '12px',
          opacity: 0.8,
          textAlign: 'center'
        }}>
          Board Diversity: {Math.round((analysis.board.diversity_score || 0) * 100)}% • 
          Cohesion: {Math.round((analysis.board.cohesion_score || 0) * 100)}%
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalysisDisplay;
