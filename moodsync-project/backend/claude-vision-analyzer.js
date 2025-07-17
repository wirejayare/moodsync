const axios = require('axios');

// Claude Vision API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

// Visual mood mapping based on image analysis
const VISUAL_MOOD_MAPPING = {
  // Color-based moods
  bright_colors: {
    moods: ['energetic', 'joyful'],
    confidence: 0.8,
    genres: ['pop', 'dance, electronic']
  },
  warm_colors: {
    moods: ['romantic, passionate', 'cozy'],
    confidence: 0.7,
    genres: ['soul', 'R&B', 'romantic']
  },
  cool_colors: {
    moods: ['calm', 'peaceful', 'serene'],
    confidence: 0.7,
    genres: ['ambient, chill, o-fi']
  },
  dark_colors: {
    moods: ['melancholic, mysterious', 'dreamy'],
    confidence: 0.6,
    genres: ['indie', 'alternative', 'dream pop']
  },
  
  // Object-based moods
  nature_scenes: {
    moods: ['peaceful', 'grounded', 'connected'],
    confidence: 0.8,
    genres: ['folk', 'acoustic', 'nature sounds']
  },
  urban_scenes: {
    moods: ['energetic, modern', 'confident'],
    confidence: 0.7,
    genres: ['hip hop', 'pop', 'electronic']
  },
  people_social: {
    moods: ['joyful', 'connected', 'social'],
    confidence: 0.8,
    genres: ['pop', 'indie pop', 'feel-good']
  },
  abstract_art: {
    moods: ['creative', 'inspired', 'artistic'],
    confidence: 0.6,
    genres: ['experimental', 'indie', 'alternative']
  }
};

// Enhanced object and activity mapping
const OBJECT_ACTIVITY_MAPPING = {
  // Activities
  cooking: {
    moods: ['focused', 'creative', 'satisfied'],
    genres: ['jazz', 'acoustic', 'lounge'],
    settings: ['kitchen', 'home']
  },
  coffee: {
    moods: ['relaxed', 'contemplative', 'nervous'],
    genres: ['coffee shop', 'acoustic', 'indie pop'],
    settings: ['cafe', 'home', 'morning']
  },
  workout: {
    moods: ['energetic', 'motivated', 'powerful'],
    genres: ['hip hop, electronic', 'pop'],
    settings: ['gym', 'outdoor', 'fitness']
  },
  reading: {
    moods: ['calm', 'ed', 'intellectual'],
    genres: ['ambient', 'classical', 'lo-fi'],
    settings: ['home', 'library', 'cozy']
  },
  party: {
    moods: ['excited', 'social', 'energetic'],
    genres: ['dance pop', 'electronic'],
    settings: ['party', 'social', 'celebration']
  },
  nature: {
    moods: ['peaceful', 'connected', 'refreshed'],
    genres: ['folk', 'acoustic', 'nature sounds'],
    settings: ['outdoor', 'nature', 'landscape']
  },
  work: {
    moods: ['focused', 'productive', 'determined'],
    genres: ['instrumental', 'ambient', 'focus'],
    settings: ['office', 'workspace', 'professional']
  },
  travel: {
    moods: ['adventurous', 'excited', 'curious'],
    genres: ['world music', 'indie', 'adventure'],
    settings: ['travel', 'exploration', 'new places']
  },
  art: {
    moods: ['creative', 'inspired', 'artistic'],
    genres: ['experimental', 'indie', 'alternative'],
    settings: ['studio', 'gallery', 'creative space']
  },
  relaxation: {
    moods: ['calm', 'peaceful', 'serene'],
    genres: ['ambient', 'chill, meditation'],
    settings: ['home', 'spa', 'wellness']
  }
};

// Settings recognition patterns
const SETTINGS_PATTERNS = {
  home: ['home', 'house', 'room', 'living room', 'bedroom', 'kitchen', 'couch'],
  outdoor: ['outdoor', 'nature', 'landscape', 'garden', 'park', 'beach', 'mountain', 'forest'],
  urban: ['city', 'urban', 'street', 'building', 'architecture', 'downtown', 'metropolitan'],
  social: ['party', 'celebration', 'gathering', 'people', 'crowd', 'social', 'event'],
  work: ['office', 'workspace', 'desk', 'computer', 'professional', 'business'],
  fitness: ['gym', 'workout', 'exercise', 'fitness', 'sports', 'training'],
  creative: ['studio', 'art', 'creative', 'gallery', 'workshop', 'design'],
  wellness: ['spa', 'wellness', 'meditation', 'yoga', 'relaxation', 'healing']
};

// Analyze a single image using Claude Vision
async function analyzeImage(imageUrl) {
  try {
    if (!ANTHROPIC_API_KEY) {
      console.log('Claude API key not configured');
      return null;
    }

    console.log('🔍 Analyzing image with Claude Vision:', imageUrl);

    const prompt = `Analyze this image for a music recommendation system. Focus on:

1. Visual Elements: Describe the main objects, colors, textures, and visual style
2. Color Analysis: Identify dominant colors and their hex codes, color temperature (warm/cool), brightness level
3. Mood & Atmosphere: What emotional vibe does this image convey? (e.g., calm, energetic, melancholic, romantic, etc.)
4. Aesthetic Style: What artistic or design style is present? (minimalist, vintage, modern, bohemian, etc.)
5. Context & Setting: Where might this be? What activity or lifestyle does it represent?
6. Cultural/Artistic References: Any specific cultural, artistic, or design influences?

Return your analysis as a JSON object with this structure:
{
  "visualElements": {
    "objects": ["object1", "object2"],
    "colors": [
      { "hex": "#FF5733", "name": "Vivid Orange", "temperature": "warm", "brightness": "bright" }
    ],
    "textures": ["smooth", "matte"],
    "style_description": "minimalist"
  },
  "mood": {
    "primary": "calm",
    "secondary": ["peaceful", "serene"],
    "confidence": 0.85,
    "atmosphere": "relaxed and inviting"
  },
  "aesthetic": {
    "style": "modern",
    "influences": ["Scandinavian", "mid-century"],
    "complexity": "simple"
  },
  "context": {
    "setting": "living room",
    "activity": "reading",
    "lifestyle": "cozy night in"
  }
}

Be specific and detailed in your analysis.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl
              }
            }
          ]
        }
      ]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    if (!response.data.content || response.data.content.length === 0) {
      console.log('❌ No Claude Vision analysis results for image');
      return null;
    }

    const analysisText = response.data.content[0];
    console.log('🔍 Raw Claude Vision response:', analysisText);
    console.log('🔍 Response type:', typeof analysisText);
    console.log('🔍 Response length:', analysisText?.text?.length || 'N/A');
    const processedAnalysis = processClaudeVisionAnalysis(analysisText, imageUrl);
    
    // Log detailed results
    logClaudeVisionAnalysis(imageUrl, processedAnalysis);
    
    return processedAnalysis;

  } catch (error) {
    console.error('❌ Claude Vision API error:', error.response?.data || error.message);
    return null;
  }
}

// Process Claude Vision analysis results
function processClaudeVisionAnalysis(analysisText, imageUrl) {
  try {
    let claudeAnalysis;
    if (typeof analysisText === 'string') {
      // Extract JSON from Claude's response string
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('❌ No JSON found in Claude Vision response');
        return createFallbackAnalysis(imageUrl);
      }
      claudeAnalysis = JSON.parse(jsonMatch[0]);
    } else if (typeof analysisText === 'object' && analysisText !== null) {
      // Already parsed JSON
      claudeAnalysis = analysisText;
    } else {
      console.log('❌ Claude Vision response is neither string nor object');
      return createFallbackAnalysis(imageUrl);
    }

    const result = {
      labels: [],
      colors: [],
      dominantColors: [],
      faces: 0,
      safeSearch: 'UNKNOWN',
      mood: null,
      confidence: 0,
      visualElements: {
        objects: [],
        colors: [],
        textures: [],
        style_description: ''
      },
      activities: [],
      settings: [],
      text: [],
      claudeAnalysis: claudeAnalysis
    };

    // Extract labels from objects
    if (claudeAnalysis.visualElements?.objects) {
      result.labels = claudeAnalysis.visualElements.objects.map(obj => ({
        name: obj,
        confidence: 0.8
      }));
    }

    // Extract colors
    if (claudeAnalysis.visualElements?.colors) {
      result.colors = claudeAnalysis.visualElements.colors.map(color => ({
        red: parseInt(color.hex.slice(1, 3), 16),
        green: parseInt(color.hex.slice(3, 5), 16),
        blue: parseInt(color.hex.slice(5, 7), 16),
        score: 0.1,
        pixelFraction: 0.1
      }));
      result.dominantColors = claudeAnalysis.visualElements.colors.map(color => ({
        hex: color.hex,
        score: 0.1,
        name: color.name || 'Unknown'
      }));
    }

    // Extract mood
    if (claudeAnalysis.mood) {
      result.mood = {
        primary: claudeAnalysis.mood.primary || 'neutral',
        confidence: claudeAnalysis.mood.confidence || 0.7,
        secondary: claudeAnalysis.mood.secondary || []
      };
    }

    // Extract objects and activities
    if (claudeAnalysis.visualElements?.objects) {
      result.objects = claudeAnalysis.visualElements.objects;
    }

    // Extract settings
    if (claudeAnalysis.context?.setting) {
      result.settings = [claudeAnalysis.context.setting];
    }

    // Determine activities based on context
    if (claudeAnalysis.context?.activity) {
      result.activities = [claudeAnalysis.context.activity];
    }

    return result;

  } catch (error) {
    console.error('❌ Error processing Claude Vision analysis:', error);
    return createFallbackAnalysis(imageUrl);
  }
}

// Create fallback analysis when Claude Vision fails
function createFallbackAnalysis(imageUrl) {
  return {
    labels: [],
    colors: [],
    dominantColors: [],
    faces: 0,
    safeSearch: 'UNKNOWN',
    mood: {
      primary: 'neutral',
      confidence: 0.5,
      secondary: []
    },
    confidence: 0.5,
    visualElements: {
      objects: [],
      colors: [],
      textures: [],
      style_description: ''
    },
    activities: [],
    settings: [],
    text: [],
    claudeAnalysis: null
  };
}

// Log detailed Claude Vision analysis results
function logClaudeVisionAnalysis(imageUrl, analysis) {
  console.log('\n🎨 CLAUDE VISION ANALYSIS RESULTS');
  console.log('================================');
  console.log(`📸 Image: ${imageUrl}`);
  
  // Log Claude's detailed analysis
  if (analysis.claudeAnalysis) {
    const claude = analysis.claudeAnalysis;
    
    if (claude.visualElements?.objects && claude.visualElements.objects.length > 0) {
      console.log('\n🏷️  DETECTED ELEMENTS:');
      claude.visualElements.objects.forEach((obj, index) => {
        console.log(`  ${index + 1}. ${obj}`);
      });
    }
    
    if (claude.visualElements?.colors && claude.visualElements.colors.length > 0) {
      console.log('\n🎨 DOMINANT COLORS:');
      claude.visualElements.colors.forEach((color, index) => {
        console.log(`  ${index + 1}. ${color.hex} - ${color.name || 'Unknown'} (${color.temperature || 'unknown'} tone)`);
      });
    }
    
    if (claude.mood) {
      console.log('\n�� MOOD ANALYSIS:');
      console.log(`  Primary Mood: ${claude.mood.primary}`);
      console.log(`  Confidence: ${Math.round((claude.mood.confidence || 0.7) * 100)}%`);
      if (claude.mood.secondary && claude.mood.secondary.length > 0) {
        console.log(`  Secondary Moods: ${claude.mood.secondary.join(', ')}`);
      }
      if (claude.mood.atmosphere) {
        console.log(`  Atmosphere: ${claude.mood.atmosphere}`);
      }
    }
    
    if (claude.aesthetic) {
      console.log('\n🎨 AESTHETIC ANALYSIS:');
      console.log(`  Style: ${claude.aesthetic.style || 'Unknown'}`);
      console.log(`  Complexity: ${claude.aesthetic.complexity || 'Unknown'}`);
      if (claude.aesthetic.influences && claude.aesthetic.influences.length > 0) {
        console.log(`  Influences: ${claude.aesthetic.influences.join(', ')}`);
      }
    }
    
    if (claude.context) {
      console.log('\n🏠 CONTEXT ANALYSIS:');
      if (claude.context.setting) {
        console.log(`  Setting: ${claude.context.setting}`);
      }
      if (claude.context.activity) {
        console.log(`  Activity: ${claude.context.activity}`);
      }
      if (claude.context.lifestyle) {
        console.log(`  Lifestyle: ${claude.context.lifestyle}`);
      }
    }
  }
  
  console.log('================================\n');
}

// Analyze multiple images using Claude Vision
async function analyzeMultipleImages(imageUrls, maxImages = 10) {
  console.log(`🎨 Analyzing ${Math.min(imageUrls.length, maxImages)} images with Claude Vision...`);
  
  const imagesToAnalyze = imageUrls.slice(0, maxImages);
  const analyses = [];
  
  for (const imageUrl of imagesToAnalyze) {
    try {
      const analysis = await analyzeImage(imageUrl);
      if (analysis) {
        analyses.push(analysis);
      }
    } catch (error) {
      console.error(`❌ Error analyzing image ${imageUrl}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully analyzed ${analyses.length} images with Claude Vision`);
  
  if (analyses.length === 0) {
    console.log('⚠️ No successful image analyses');
    return null;
  }
  
  const aggregatedResults = aggregateClaudeVisionAnalysis(analyses);
  logAggregatedClaudeVisionResults(aggregatedResults);
  
  return aggregatedResults;
}

// Aggregate multiple Claude Vision analyses
function aggregateClaudeVisionAnalysis(analyses) {
  const aggregated = {
    imagesAnalyzed: analyses.length,
    totalFaces: 0,
    averageBrightness: 0,
    colorDiversity: 0,
    commonLabels: [],
    objects: [],
    activities: [],
    settings: [],
    mood: {
      primary: 'neutral',
      confidence: 0,
      secondary: []
    },
    visualElements: {
      colorPalette: [],
      dominantColors: { hex: '#000000', name: 'Unknown' },
      aestheticStyle: 'unknown',
      visualComplexity: 'medium'
    },
    claudeInsights: {
      commonMoods: [],
      aestheticStyles: [],
      contexts: [],
      activities: []
    }
  };

  // Aggregate colors
  const allColors = [];
  analyses.forEach(analysis => {
    if (analysis.dominantColors) {
      allColors.push(...analysis.dominantColors);
    }
  });

  if (allColors.length > 0) {
    aggregated.visualElements.colorPalette = allColors.slice(0, 5);
    aggregated.visualElements.dominantColors = allColors[0];
  }

  // Aggregate moods
  const moodScores = {};
  analyses.forEach(analysis => {
    if (analysis.mood) {
      const mood = analysis.mood.primary;
      moodScores[mood] = (moodScores[mood] || 0) + (analysis.mood.confidence || 0.7);
    }
  });

  if (Object.keys(moodScores).length > 0) {
    const primaryMood = Object.entries(moodScores)
      .sort(([,a], [,b]) => b - a)[0];
    aggregated.mood = {
      primary: primaryMood[0],
      confidence: primaryMood[1] / analyses.length,
      secondary: Object.keys(moodScores).slice(1, 3)
    };
  }

  // Aggregate Claude insights
  const allMoods = [];
  const allStyles = [];
  const allContexts = [];
  const allActivities = [];

  analyses.forEach(analysis => {
    if (analysis.claudeAnalysis) {
      if (analysis.claudeAnalysis.mood?.primary) {
        allMoods.push(analysis.claudeAnalysis.mood.primary);
      }
      if (analysis.claudeAnalysis.aesthetic?.style) {
        allStyles.push(analysis.claudeAnalysis.aesthetic.style);
      }
      if (analysis.claudeAnalysis.context?.setting) {
        allContexts.push(analysis.claudeAnalysis.context.setting);
      }
      if (analysis.claudeAnalysis.context?.activity) {
        allActivities.push(analysis.claudeAnalysis.context.activity);
      }
    }
  });

  aggregated.claudeInsights = {
    commonMoods: [...new Set(allMoods)].slice(0,3),
    aestheticStyles: [...new Set(allStyles)].slice(0,3),
    contexts: [...new Set(allContexts)].slice(0, 3),
    activities: [...new Set(allActivities)].slice(0,3)
  };

  return aggregated;
}

// Log aggregated Claude Vision results
function logAggregatedClaudeVisionResults(results) {
  console.log('\n📊 AGGREGATED CLAUDE VISION ANALYSIS');
  console.log('=====================================');
  console.log(`📸 Images Analyzed: ${results.imagesAnalyzed}`);
  console.log(`🎭 Primary Mood: ${results.mood.primary} (${Math.round(results.mood.confidence * 100)}% confidence)`);
  
  if (results.visualElements.colorPalette.length > 0) {
    console.log('\n🎨 Overall Color Palette:');
    results.visualElements.colorPalette.forEach((color, index) => {
      console.log(`  ${index + 1}. ${color.hex}`);
    });
  }
  
  if (results.claudeInsights.commonMoods.length > 0) {
    console.log('\n🎭 Common Moods:');
    results.claudeInsights.commonMoods.forEach((mood, index) => {
      console.log(`  ${index + 1}. ${mood}`);
    });
  }
  
  if (results.claudeInsights.aestheticStyles.length > 0) {
    console.log('\n🎨 Aesthetic Styles:');
    results.claudeInsights.aestheticStyles.forEach((style, index) => {
      console.log(`  ${index + 1}. ${style}`);
    });
  }
  
  if (results.claudeInsights.contexts.length > 0) {
    console.log('\n🏠 Common Contexts:');
    results.claudeInsights.contexts.forEach((context, index) => {
      console.log(`  ${index + 1}. ${context}`);
    });
  }
  
  console.log('=====================================\n');
}

module.exports = {
  analyzeImage,
  analyzeMultipleImages,
  aggregateClaudeVisionAnalysis,
  logClaudeVisionAnalysis,
  logAggregatedClaudeVisionResults
}; 