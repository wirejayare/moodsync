import React from 'react';
import styles from './VisionAnalysisDisplay.module.css';

const VisionAnalysisDisplay = ({ analysis }) => {
  if (!analysis || !analysis.visual || !analysis.visual.visual_analysis) {
    return null;
  }

  const visualAnalysis = analysis.visual.visual_analysis;

  return (
    <div className={styles.visionAnalysisContainer}>
      <h3 className={styles.visionTitle}>🎨 Visual Analysis Results</h3>
      
      {/* Analysis Summary */}
      <div className={styles.analysisSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>📸 Images Analyzed:</span>
          <span className={styles.summaryValue}>{visualAnalysis.images_analyzed}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>👥 Faces Detected:</span>
          <span className={styles.summaryValue}>{visualAnalysis.total_faces}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>💡 Average Brightness:</span>
          <span className={styles.summaryValue}>{Math.round(visualAnalysis.average_brightness * 100)}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>🌈 Color Diversity:</span>
          <span className={styles.summaryValue}>{Math.round(visualAnalysis.color_diversity * 100)}%</span>
        </div>
      </div>

      {/* Color Palette */}
      {analysis.visual.color_palette && analysis.visual.color_palette.length > 0 && (
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
      {visualAnalysis.common_labels && visualAnalysis.common_labels.length > 0 && (
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

      {/* Analysis Method */}
      <div className={styles.methodSection}>
        <div className={styles.methodBadge}>
          🔍 {analysis.analysis_method === 'pinterest_api_vision_enhanced' ? 'Vision + Text Analysis' : 'Text Analysis Only'}
        </div>
        <div className={styles.methodDescription}>
          {analysis.analysis_method === 'pinterest_api_vision_enhanced' 
            ? 'Combined visual and textual analysis for enhanced accuracy'
            : 'Text-based analysis (Vision API not available)'
          }
        </div>
      </div>
    </div>
  );
};

export default VisionAnalysisDisplay; 