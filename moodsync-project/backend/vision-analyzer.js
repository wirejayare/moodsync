const axios = require('axios');

// Google Cloud Vision API configuration
const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Visual mood mapping based on image analysis
const VISUAL_MOOD_MAPPING = {
  // Color-based moods
  bright_colors: {
    moods: ['energetic', 'joyful', 'excited'],
    confidence: 0.8,
    genres: ['pop', 'dance', 'electronic']
  },
  warm_colors: {
    moods: ['romantic', 'passionate', 'cozy'],
    confidence: 0.7,
    genres: ['soul', 'R&B', 'romantic']
  },
  cool_colors: {
    moods: ['calm', 'peaceful', 'serene'],
    confidence: 0.7,
    genres: ['ambient', 'chill', 'lo-fi']
  },
  dark_colors: {
    moods: ['melancholic', 'mysterious', 'dreamy'],
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
    moods: ['energetic', 'modern', 'confident'],
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

// Analyze a single image using Google Vision API
async function analyzeImage(imageUrl) {
  try {
    if (!VISION_API_KEY) {
      console.log('Google Vision API key not configured');
      return null;
    }

    console.log('🔍 Analyzing image:', imageUrl);

    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'IMAGE_PROPERTIES',
              maxResults: 1
            },
            {
              type: 'SAFE_SEARCH_DETECTION',
              maxResults: 1
            },
            {
              type: 'FACE_DETECTION',
              maxResults: 10
            }
          ]
        }
      ]
    };

    const response = await axios.post(`${VISION_API_URL}?key=${VISION_API_KEY}`, requestBody);
    
    if (!response.data.responses || response.data.responses.length === 0) {
      console.log('❌ No analysis results for image');
      return null;
    }

    const analysis = response.data.responses[0];
    const processedAnalysis = processVisionAnalysis(analysis);
    
    // Log detailed results
    logVisionAnalysis(imageUrl, processedAnalysis);
    
    return processedAnalysis;

  } catch (error) {
    console.error('❌ Vision API error:', error.response?.data || error.message);
    return null;
  }
}

// Log detailed vision analysis results
function logVisionAnalysis(imageUrl, analysis) {
  console.log('\n🎨 VISION API ANALYSIS RESULTS');
  console.log('================================');
  console.log(`📸 Image: ${imageUrl}`);
  
  // Log labels
  if (analysis.labels && analysis.labels.length > 0) {
    console.log('\n🏷️  DETECTED LABELS:');
    analysis.labels.forEach((label, index) => {
      console.log(`  ${index + 1}. ${label.name} (${Math.round(label.confidence * 100)}% confidence)`);
    });
  }
  
  // Log colors
  if (analysis.dominantColors && analysis.dominantColors.length > 0) {
    console.log('\n🎨 DOMINANT COLORS:');
    analysis.dominantColors.forEach((color, index) => {
      console.log(`  ${index + 1}. ${color.hex} (${Math.round(color.score * 100)}% coverage)`);
    });
  }
  
  // Log faces
  console.log(`\n👥 FACES DETECTED: ${analysis.faces}`);
  
  // Log mood analysis
  if (analysis.mood) {
    console.log('\n🎭 MOOD ANALYSIS:');
    console.log(`  Primary Mood: ${analysis.mood.primary}`);
    console.log(`  Confidence: ${Math.round(analysis.mood.confidence * 100)}%`);
    if (analysis.mood.secondary && analysis.mood.secondary.length > 0) {
      console.log(`  Secondary Moods: ${analysis.mood.secondary.join(', ')}`);
    }
  }
  
  console.log('================================\n');
}

// Process Vision API results into mood analysis
function processVisionAnalysis(analysis) {
  const result = {
    labels: [],
    colors: [],
    dominantColors: [],
    faces: 0,
    safeSearch: 'UNKNOWN',
    mood: null,
    confidence: 0,
    visualElements: []
  };

  // Extract labels
  if (analysis.labelAnnotations) {
    result.labels = analysis.labelAnnotations.map(label => ({
      name: label.description,
      confidence: label.score
    }));
  }

  // Extract color information
  if (analysis.imagePropertiesAnnotation && analysis.imagePropertiesAnnotation.dominantColors) {
    const colors = analysis.imagePropertiesAnnotation.dominantColors.colors;
    result.colors = colors.map(color => ({
      red: color.color.red,
      green: color.color.green,
      blue: color.color.blue,
      score: color.score,
      pixelFraction: color.pixelFraction
    }));
    
    // Get dominant colors
    result.dominantColors = colors.slice(0, 5).map(color => ({
      hex: rgbToHex(color.color.red, color.color.green, color.color.blue),
      score: color.score
    }));
  }

  // Count faces
  if (analysis.faceAnnotations) {
    result.faces = analysis.faceAnnotations.length;
  }

  // Safe search
  if (analysis.safeSearchAnnotation) {
    result.safeSearch = analysis.safeSearchAnnotation.adult;
  }

  // Determine mood based on visual analysis
  result.mood = determineVisualMood(result);
  
  return result;
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Determine mood based on visual elements
function determineVisualMood(analysis) {
  const moodScores = {};
  
  console.log('\n🧠 MOOD DETECTION PROCESS:');
  console.log('==========================');
  
  // Analyze colors
  if (analysis.dominantColors.length > 0) {
    const dominantColor = analysis.dominantColors[0];
    const { r, g, b } = hexToRgb(dominantColor.hex);
    
    console.log(`🎨 Color Analysis: ${dominantColor.hex} (R:${r}, G:${g}, B:${b})`);
    
    // Bright colors
    if (r > 200 && g > 200 && b > 200) {
      addMoodScore(moodScores, 'energetic', 0.8);
      addMoodScore(moodScores, 'joyful', 0.7);
      console.log('  → Bright colors detected → Energetic/Joyful mood');
    }
    // Warm colors (reds, oranges, yellows)
    else if (r > g && r > b && r > 150) {
      addMoodScore(moodScores, 'passionate', 0.8);
      addMoodScore(moodScores, 'romantic', 0.7);
      console.log('  → Warm colors detected → Passionate/Romantic mood');
    }
    // Cool colors (blues, greens)
    else if (b > r && b > g && b > 150) {
      addMoodScore(moodScores, 'calm', 0.8);
      addMoodScore(moodScores, 'peaceful', 0.7);
      console.log('  → Cool colors detected → Calm/Peaceful mood');
    }
    // Dark colors
    else if (r < 100 && g < 100 && b < 100) {
      addMoodScore(moodScores, 'melancholic', 0.7);
      addMoodScore(moodScores, 'mysterious', 0.6);
      console.log('  → Dark colors detected → Melancholic/Mysterious mood');
    }
  }

  // Analyze labels for content-based mood
  if (analysis.labels.length > 0) {
    const labelText = analysis.labels.map(l => l.name.toLowerCase()).join(' ');
    console.log(`🏷️  Content Analysis: "${labelText}"`);
    
    // Nature scenes
    if (labelText.includes('nature') || labelText.includes('landscape') || labelText.includes('forest')) {
      addMoodScore(moodScores, 'peaceful', 0.8);
      addMoodScore(moodScores, 'grounded', 0.7);
      console.log('  → Nature scene detected → Peaceful/Grounded mood');
    }
    
    // Urban scenes
    if (labelText.includes('city') || labelText.includes('urban') || labelText.includes('building')) {
      addMoodScore(moodScores, 'energetic', 0.7);
      addMoodScore(moodScores, 'modern', 0.6);
      console.log('  → Urban scene detected → Energetic/Modern mood');
    }
    
    // People/social
    if (labelText.includes('person') || labelText.includes('people') || labelText.includes('group')) {
      addMoodScore(moodScores, 'social', 0.8);
      addMoodScore(moodScores, 'connected', 0.7);
      console.log('  → People detected → Social/Connected mood');
    }
    
    // Abstract/artistic
    if (labelText.includes('art') || labelText.includes('abstract') || labelText.includes('creative')) {
      addMoodScore(moodScores, 'creative', 0.7);
      addMoodScore(moodScores, 'inspired', 0.6);
      console.log('  → Artistic content detected → Creative/Inspired mood');
    }
  }

  // Face detection
  if (analysis.faces > 0) {
    addMoodScore(moodScores, 'social', 0.6);
    addMoodScore(moodScores, 'connected', 0.5);
    console.log(`  → ${analysis.faces} face(s) detected → Social/Connected mood`);
  }

  // Return the highest scoring mood
  const sortedMoods = Object.entries(moodScores)
    .sort(([,a], [,b]) => b - a);
  
  const finalMood = sortedMoods.length > 0 ? {
    primary: sortedMoods[0][0],
    confidence: sortedMoods[0][1],
    secondary: sortedMoods.slice(1, 3).map(([mood]) => mood)
  } : {
    primary: 'balanced',
    confidence: 0.5,
    secondary: []
  };
  
  console.log(`🎯 FINAL MOOD: ${finalMood.primary} (${Math.round(finalMood.confidence * 100)}% confidence)`);
  console.log('==========================\n');
  
  return finalMood;
}

// Helper function to add mood scores
function addMoodScore(scores, mood, score) {
  scores[mood] = (scores[mood] || 0) + score;
}

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Analyze multiple images and aggregate results
async function analyzeMultipleImages(imageUrls, maxImages = 10) {
  try {
    console.log(`🔍 Starting Vision API analysis of ${Math.min(imageUrls.length, maxImages)} images...`);
    
    const imagesToAnalyze = imageUrls.slice(0, maxImages);
    const analysisPromises = imagesToAnalyze.map(url => analyzeImage(url));
    
    const results = await Promise.allSettled(analysisPromises);
    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (successfulResults.length === 0) {
      console.log('❌ No successful image analyses');
      return null;
    }

    console.log(`✅ Successfully analyzed ${successfulResults.length} images`);
    const aggregatedResults = aggregateVisualAnalysis(successfulResults);
    
    // Log aggregated results
    logAggregatedResults(aggregatedResults);
    
    return aggregatedResults;

  } catch (error) {
    console.error('❌ Multiple image analysis error:', error);
    return null;
  }
}

// Log aggregated vision analysis results
function logAggregatedResults(results) {
  console.log('\n📊 AGGREGATED VISION ANALYSIS');
  console.log('===============================');
  console.log(`📸 Images Analyzed: ${results.imagesAnalyzed}`);
  console.log(`🎭 Primary Mood: ${results.primaryMood} (${Math.round(results.confidence * 100)}% confidence)`);
  
  if (results.dominantColors && results.dominantColors.length > 0) {
    console.log('\n🎨 Overall Color Palette:');
    results.dominantColors.forEach((color, index) => {
      console.log(`  ${index + 1}. ${color}`);
    });
  }
  
  if (results.commonLabels && results.commonLabels.length > 0) {
    console.log('\n🏷️  Most Common Elements:');
    results.commonLabels.slice(0, 5).forEach((label, index) => {
      console.log(`  ${index + 1}. ${label.name} (${label.count} times)`);
    });
  }
  
  console.log(`👥 Total Faces: ${results.visualElements.totalFaces}`);
  console.log(`💡 Average Brightness: ${Math.round(results.visualElements.averageBrightness * 100)}%`);
  console.log(`🌈 Color Diversity: ${Math.round(results.visualElements.colorDiversity * 100)}%`);
  console.log('===============================\n');
}

// Aggregate multiple image analyses into overall mood
function aggregateVisualAnalysis(analyses) {
  const moodCounts = {};
  const colorPalette = [];
  const allLabels = [];
  
  analyses.forEach(analysis => {
    // Count moods
    if (analysis.mood) {
      const primary = analysis.mood.primary;
      moodCounts[primary] = (moodCounts[primary] || 0) + 1;
    }
    
    // Collect colors
    if (analysis.dominantColors) {
      colorPalette.push(...analysis.dominantColors);
    }
    
    // Collect labels
    if (analysis.labels) {
      allLabels.push(...analysis.labels);
    }
  });

  // Determine overall mood
  const sortedMoods = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a);
  
  const primaryMood = sortedMoods.length > 0 ? sortedMoods[0][0] : 'balanced';
  const confidence = sortedMoods.length > 0 ? 
    Math.min(sortedMoods[0][1] / analyses.length, 0.95) : 0.5;

  // Get most common colors
  const colorCounts = {};
  colorPalette.forEach(color => {
    colorCounts[color.hex] = (colorCounts[color.hex] || 0) + 1;
  });
  
  const dominantColors = Object.entries(colorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([hex]) => hex);

  // Get most common labels
  const labelCounts = {};
  allLabels.forEach(label => {
    labelCounts[label.name] = (labelCounts[label.name] || 0) + 1;
  });
  
  const commonLabels = Object.entries(labelCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    primaryMood,
    confidence,
    dominantColors,
    commonLabels,
    imagesAnalyzed: analyses.length,
    visualElements: {
      totalFaces: analyses.reduce((sum, a) => sum + a.faces, 0),
      averageBrightness: calculateAverageBrightness(colorPalette),
      colorDiversity: calculateColorDiversity(colorPalette)
    }
  };
}

// Calculate average brightness from colors
function calculateAverageBrightness(colors) {
  if (colors.length === 0) return 0;
  
  const brightnesses = colors.map(color => {
    const rgb = hexToRgb(color.hex);
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  });
  
  return brightnesses.reduce((sum, b) => sum + b, 0) / brightnesses.length;
}

// Calculate color diversity
function calculateColorDiversity(colors) {
  if (colors.length < 2) return 0;
  
  const uniqueColors = new Set(colors.map(c => c.hex));
  return uniqueColors.size / colors.length;
}

module.exports = {
  analyzeImage,
  analyzeMultipleImages,
  aggregateVisualAnalysis
}; 