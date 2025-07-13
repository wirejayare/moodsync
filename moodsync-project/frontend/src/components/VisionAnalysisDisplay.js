import React from 'react';
import styles from './VisionAnalysisDisplay.module.css';

const VisionAnalysisDisplay = ({ analysis }) => {
  // Debug logging
  console.log('VisionAnalysisDisplay received analysis:', analysis);
  
  // Check if we have any visual analysis data
  const hasVisualAnalysis = analysis && analysis.visual && analysis.visual.visual_analysis;
  const hasVisionMethod = analysis && (analysis.analysis_method === 'pinterest_api_vision_enhanced' || analysis.analysis_method === 'url_vision_enhanced');
  const hasVisualData = analysis && analysis.visual;
  
  console.log('Has visual analysis:', hasVisualAnalysis);
  console.log('Has vision method:', hasVisionMethod);
  console.log('Has visual data:', hasVisualData);
  
  // Show component if we have any visual data, even if not from Vision API
  if (!hasVisualData) {
    console.log('No visual data to display');
    return null;
  }

  const visualAnalysis = analysis.visual?.visual_analysis;

  return (
    <div className={styles.visionAnalysisContainer}>
      <h3 className={styles.visionTitle}>🎨 Visual Analysis Results</h3>
      
      {/* Analysis Summary */}
      {visualAnalysis && (
        <div className={styles.analysisSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>📸 Images Analyzed:</span>
            <span className={styles.summaryValue}>{visualAnalysis.images_analyzed || 'N/A'}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>👥 Faces Detected:</span>
            <span className={styles.summaryValue}>{visualAnalysis.total_faces || 0}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>💡 Average Brightness:</span>
            <span className={styles.summaryValue}>
              {visualAnalysis.average_brightness ? Math.round(visualAnalysis.average_brightness * 100) : 0}%
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>🌈 Color Diversity:</span>
            <span className={styles.summaryValue}>
              {visualAnalysis.color_diversity ? Math.round(visualAnalysis.color_diversity * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Color Palette */}
      {analysis.visual && analysis.visual.color_palette && analysis.visual.color_palette.length > 0 && (
        <div className={styles.colorSection}>
          <h4 className={styles.sectionTitle}>🎨 Dominant Colors</h4>
          <div className={styles.colorPalette}>
            {analysis.visual.color_palette.slice(0, 5).map((color, index) => (
              <div key={index} className={styles.colorSwatch}>
                <div 
                  className={styles.colorBox}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.hex} - ${color.name}`}
                />
                <span className={styles.colorInfo}>
                  <span className={styles.colorHex}>{color.hex}</span>
                  <span className={styles.colorName}>{color.name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Objects */}
      {visualAnalysis && visualAnalysis.common_labels && visualAnalysis.common_labels.length > 0 && (
        <div className={styles.objectsSection}>
          <h4 className={styles.sectionTitle}>🏷️ Detected Elements</h4>
          <div className={styles.objectsList}>
            {visualAnalysis.common_labels.slice(0, 8).map((label, index) => (
              <div key={index} className={styles.objectItem}>
                <span className={styles.objectName}>{label.name}</span>
                <span className={styles.objectCount}>{label.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Mapping */}
      {analysis.mood && (
        <div className={styles.moodSection}>
          <h4 className={styles.sectionTitle}>🎭 Visual Mood Mapping</h4>
          <div className={styles.moodMapping}>
            <div className={styles.moodItem}>
              <span className={styles.moodLabel}>Primary Mood:</span>
              <span className={styles.moodValue}>{analysis.mood.primary}</span>
            </div>
            {analysis.mood.secondary && analysis.mood.secondary.length > 0 && (
              <div className={styles.moodItem}>
                <span className={styles.moodLabel}>Secondary:</span>
                <span className={styles.moodValue}>{analysis.mood.secondary.join(', ')}</span>
              </div>
            )}
            <div className={styles.moodItem}>
              <span className={styles.moodLabel}>Confidence:</span>
              <span className={styles.moodValue}>{Math.round(analysis.mood.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Reasoning */}
      {analysis.music && analysis.music.reasoning && analysis.music.reasoning.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'white'
          }}>🧠 AI Reasoning</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analysis.music.reasoning.map((reason, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.95rem',
                lineHeight: '1.4',
                color: 'white'
              }}>
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Method */}
      <div className={styles.methodSection}>
        <div className={styles.methodBadge}>
          🔍 {hasVisionMethod ? 'Vision + Text Analysis' : 'Text Analysis Only'}
        </div>
        <div className={styles.methodDescription}>
          {hasVisionMethod 
            ? 'Combined visual and textual analysis for enhanced accuracy'
            : 'Text-based analysis (Connect Pinterest for Vision API analysis)'
          }
        </div>
        {!hasVisionMethod && (
          <div className={styles.upgradeNote}>
            💡 <strong>Pro tip:</strong> Connect your Pinterest account to enable Vision API analysis for more accurate mood detection!
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionAnalysisDisplay; 