import React, { useState, useEffect } from 'react';
import styles from './AnimatedAnalysisDisplay.module.css';

const AnimatedAnalysisDisplay = ({ isAnalyzing, analysis, onAnalysisComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [discoveredThemes, setDiscoveredThemes] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  // Animation steps
  const animationSteps = [
    { name: 'Analyzing Visual Elements', duration: 2000 },
    { name: 'Detecting Mood Patterns', duration: 2500 },
    { name: 'Mapping Music Genres', duration: 2000 },
    { name: 'Finalizing Recommendations', duration: 1500 }
  ];

  // Key themes to discover
  const keyThemes = [
    { id: 'visual', name: 'Visual Style', icon: '🎨', description: 'Color palette and aesthetic' },
    { id: 'mood', name: 'Emotional Tone', icon: '🎭', description: 'Mood and atmosphere' },
    { id: 'activity', name: 'Activity Context', icon: '🏃', description: 'Activities and settings' }
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setIsComplete(true);
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
      return;
    }

    // Start animation sequence
    const startAnimation = async () => {
      for (let i = 0; i < animationSteps.length; i++) {
        setCurrentStep(i);
        
        // Discover themes during animation
        if (i === 0) {
          // Visual theme
          setTimeout(() => {
            setDiscoveredThemes(prev => [...prev, keyThemes[0]]);
          }, 1000);
        } else if (i === 1) {
          // Mood theme
          setTimeout(() => {
            setDiscoveredThemes(prev => [...prev, keyThemes[1]]);
          }, 1200);
        } else if (i === 2) {
          // Activity theme
          setTimeout(() => {
            setDiscoveredThemes(prev => [...prev, keyThemes[2]]);
          }, 1000);
        }

        await new Promise(resolve => setTimeout(resolve, animationSteps[i].duration));
      }

      setIsComplete(true);
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    };

    startAnimation();
  }, [isAnalyzing]);

  // Get theme details from analysis
  const getThemeDetails = (themeId) => {
    if (!analysis) return null;

    switch (themeId) {
      case 'visual':
        return {
          primary: analysis.visual?.dominant_colors?.hex || '#000000',
          secondary: analysis.visual?.color_palette?.slice(1, 3).map(c => c.hex) || [],
          style: analysis.visual?.aesthetic_style || 'Modern',
          confidence: analysis.visual?.visual_analysis?.color_diversity ? 
            Math.round(analysis.visual.visual_analysis.color_diversity * 100) : 75
        };
      case 'mood':
        return {
          primary: analysis.mood?.primary || 'Balanced',
          secondary: analysis.mood?.secondary || [],
          confidence: analysis.mood?.confidence ? 
            Math.round(analysis.mood.confidence * 100) : 80,
          energy: analysis.music?.energy_level || 'medium'
        };
      case 'activity':
        return {
          activities: analysis.visual?.visual_analysis?.activities || [],
          settings: analysis.visual?.visual_analysis?.settings || [],
          objects: analysis.visual?.visual_analysis?.objects || [],
          genres: analysis.music?.primary_genres || []
        };
      default:
        return null;
    }
  };

  if (!isAnalyzing && !isComplete) {
    return null;
  }

  return (
    <div className={styles.animatedAnalysisContainer}>
      <div className={styles.analysisHeader}>
        <h3 className={styles.analysisTitle}>
          {isAnalyzing ? '🔍 Analyzing Your Pinterest Board...' : '✅ Analysis Complete!'}
        </h3>
        {isAnalyzing && (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${((currentStep + 1) / animationSteps.length) * 100}%` 
              }}
            />
          </div>
        )}
      </div>

      {/* Current Step Indicator */}
      {isAnalyzing && (
        <div className={styles.currentStep}>
          <div className={styles.stepIcon}>⚡</div>
          <div className={styles.stepText}>{animationSteps[currentStep].name}</div>
        </div>
      )}

      {/* Discovered Themes */}
      <div className={styles.themesContainer}>
        <h4 className={styles.themesTitle}>
          {isAnalyzing ? '🎯 Discovering Key Themes...' : '🎯 Key Themes Discovered'}
        </h4>
        
        <div className={styles.themesGrid}>
          {keyThemes.map((theme, index) => {
            const isDiscovered = discoveredThemes.some(t => t.id === theme.id);
            const themeDetails = getThemeDetails(theme.id);
            
            return (
              <div 
                key={theme.id}
                className={`${styles.themeCard} ${isDiscovered ? styles.discovered : styles.pending}`}
                style={{ 
                  animationDelay: `${index * 200}ms`,
                  opacity: isDiscovered ? 1 : 0.3
                }}
              >
                <div className={styles.themeHeader}>
                  <span className={styles.themeIcon}>{theme.icon}</span>
                  <span className={styles.themeName}>{theme.name}</span>
                  {isDiscovered && <span className={styles.checkmark}>✅</span>}
                </div>
                
                <div className={styles.themeDescription}>
                  {theme.description}
                </div>

                {isDiscovered && themeDetails && (
                  <div className={styles.themeDetails}>
                    {theme.id === 'visual' && (
                      <div className={styles.visualDetails}>
                        <div className={styles.colorPreview}>
                          <div 
                            className={styles.colorSwatch}
                            style={{ backgroundColor: themeDetails.primary }}
                          />
                          <span className={styles.styleName}>{themeDetails.style}</span>
                        </div>
                        <div className={styles.confidence}>
                          Confidence: {themeDetails.confidence}%
                        </div>
                      </div>
                    )}
                    
                    {theme.id === 'mood' && (
                      <div className={styles.moodDetails}>
                        <div className={styles.moodPrimary}>{themeDetails.primary}</div>
                        <div className={styles.moodEnergy}>
                          Energy: {themeDetails.energy}
                        </div>
                        <div className={styles.confidence}>
                          Confidence: {themeDetails.confidence}%
                        </div>
                      </div>
                    )}
                    
                    {theme.id === 'activity' && (
                      <div className={styles.activityDetails}>
                        <div className={styles.activitiesList}>
                          {themeDetails.activities.slice(0, 2).map((activity, i) => (
                            <span key={i} className={styles.activityTag}>
                              {activity.name}
                            </span>
                          ))}
                        </div>
                        <div className={styles.genresList}>
                          {themeDetails.genres.slice(0, 2).map((genre, i) => (
                            <span key={i} className={styles.genreTag}>
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Summary */}
      {isComplete && analysis && (
        <div className={styles.analysisSummary}>
          <div className={styles.summaryHeader}>
            <h4>🎵 Music Recommendation Summary</h4>
          </div>
          
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Primary Genres:</span>
              <span className={styles.summaryValue}>
                {analysis.music?.primary_genres?.slice(0, 3).join(', ')}
              </span>
            </div>
            
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Energy Level:</span>
              <span className={styles.summaryValue}>
                {analysis.music?.energy_level}
              </span>
            </div>
            
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Tempo Range:</span>
              <span className={styles.summaryValue}>
                {analysis.music?.tempo_range}
              </span>
            </div>
          </div>

          {analysis.music?.ai_reasoning && analysis.music.ai_reasoning.length > 0 && (
            <div className={styles.reasoningSection}>
              <h5>🤖 AI Reasoning:</h5>
              <ul className={styles.reasoningList}>
                {analysis.music.ai_reasoning.slice(0, 3).map((reason, index) => (
                  <li key={index} className={styles.reasoningItem}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimatedAnalysisDisplay; 