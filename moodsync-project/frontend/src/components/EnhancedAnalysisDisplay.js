// src/components/EnhancedAnalysisDisplay.js
import React from 'react';

const EnhancedAnalysisDisplay = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <section className="apple-glass enhanced-analysis-display" aria-label="Comprehensive Mood Analysis">
      <h4 className="ead-title">🎨 Comprehensive Mood Analysis</h4>
      {/* Primary Mood Section */}
      <div className="ead-section ead-mood-section">
        <div className="ead-mood-header">
          <h5 className="ead-mood-title">🎭 Primary Mood</h5>
          <div className="ead-confidence">
            {Math.round((analysis.mood?.confidence || 0) * 100)}% confidence
          </div>
        </div>
        <div className="ead-mood-primary">
          {analysis.mood?.primary || 'Unknown'}
        </div>
        {analysis.mood?.secondary && (
          <div className="ead-mood-secondary">
            Secondary moods: {analysis.mood.secondary.join(', ')}
          </div>
        )}
        {/* Emotional Spectrum */}
        {analysis.mood?.emotional_spectrum && (
          <div className="ead-spectrum">
            <div className="ead-spectrum-title">Emotional Spectrum:</div>
            {analysis.mood.emotional_spectrum.slice(0, 5).map((mood, index) => (
              <div key={index} className="ead-spectrum-row">
                <span className="ead-spectrum-label">{mood.name}</span>
                <div className="ead-spectrum-bar-bg">
                  <div
                    className="ead-spectrum-bar"
                    style={{ width: `${mood.confidence * 100}%`, background: `hsl(${120 * mood.confidence}, 70%, 60%)` }}
                  />
                </div>
                <span className="ead-spectrum-value">{Math.round(mood.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Visual Analysis Section */}
      {analysis.visual && (
        <div className="ead-section ead-visual-section">
          <h5 className="ead-section-title">👁️ Visual Analysis</h5>
          <div className="ead-visual-grid">
            {/* Color Palette */}
            <div>
              <div className="ead-label">Color Palette</div>
              <div className="ead-color-palette">
                {analysis.visual.color_palette?.slice(0, 8).map((color, index) => (
                  <div
                    key={index}
                    className="ead-color-dot"
                    style={{ backgroundColor: color.hex || '#ccc' }}
                    title={`${color.hex} - ${color.mood}`}
                  />
                ))}
              </div>
              <div className="ead-meta">Temperature: {analysis.visual.color_temperature}</div>
              <div className="ead-meta">Harmony: {analysis.visual.color_harmony}</div>
            </div>
            {/* Style Analysis */}
            <div>
              <div className="ead-label">Style & Composition</div>
              <div className="ead-style-meta">
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
        <div className="ead-section ead-content-section">
          <h5 className="ead-section-title">📝 Content Analysis</h5>
          <div className="ead-content-grid">
            {/* Sentiment */}
            <div>
              <div className="ead-label">Overall Sentiment</div>
              <div className="ead-sentiment-box">
                <span className="ead-sentiment-emoji">
                  {analysis.content.sentiment?.label === 'positive' ? '😊' : 
                   analysis.content.sentiment?.label === 'negative' ? '😔' : '😐'}
                </span>
                <span className="ead-sentiment-label" style={{ textTransform: 'capitalize' }}>
                  {analysis.content.sentiment?.label || 'Neutral'}
                </span>
              </div>
            </div>
            {/* Top Keywords */}
            <div>
              <div className="ead-label">Key Themes</div>
              <div className="ead-keywords">
                {analysis.content.keywords?.slice(0, 6).map((keyword, index) => (
                  <span key={index} className="ead-keyword">
                    {keyword.word}
                  </span>
                ))}
              </div>
            </div>
            {/* Topics */}
            {analysis.content.topics && analysis.content.topics.length > 0 && (
              <div>
                <div className="ead-label">Content Categories</div>
                <div className="ead-topics">
                  {analysis.content.topics.slice(0, 4).map((topic, index) => (
                    <div key={index} className="ead-topic">• {topic}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Music Recommendation Insights */}
      {analysis.music && (
        <div className="ead-section ead-music-section">
          <h5 className="ead-section-title">🎵 Music Recommendations</h5>
          <div className="ead-music-grid">
            {/* Genres */}
            <div>
              <div className="ead-label">Suggested Genres</div>
              <div className="ead-genres">
                {analysis.music.primary_genres?.map((genre, index) => (
                  <span key={index} className="ead-genre">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
            {/* Energy & Style */}
            <div>
              <div className="ead-label">Musical Characteristics</div>
              <div className="ead-music-meta">
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
        <div className="ead-board-insights">
          Board Diversity: {Math.round((analysis.board.diversity_score || 0) * 100)}% • 
          Cohesion: {Math.round((analysis.board.cohesion_score || 0) * 100)}%
        </div>
      )}
    </section>
  );
};

export default EnhancedAnalysisDisplay;
