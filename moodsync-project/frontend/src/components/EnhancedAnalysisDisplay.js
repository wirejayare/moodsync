// Enhanced Pinterest Analysis Backend
const axios = require('axios');
const sharp = require('sharp'); // For image processing
const ColorThief = require('colorthief'); // For color extraction
const tf = require('@tensorflow/tfjs-node'); // For computer vision

// Enhanced Pinterest board analysis with computer vision
async function enhancedAnalyzePinterestBoard(url) {
  try {
    console.log('Enhanced analysis starting for:', url);
    
    // Extract board info from URL
    const boardInfo = extractBoardInfo(url);
    
    // Get Pinterest data (you'll need Pinterest API access for this)
    const pinterestData = await fetchPinterestData(boardInfo);
    
    // Analyze images with computer vision
    const visualAnalysis = await analyzeImagesWithCV(pinterestData.pins);
    
    // Extract text sentiment from pin descriptions
    const textAnalysis = await analyzeTextContent(pinterestData.pins);
    
    // Combine all analysis
    const comprehensiveAnalysis = await synthesizeAnalysis({
      boardInfo,
      pinterestData,
      visualAnalysis,
      textAnalysis
    });
    
    return comprehensiveAnalysis;
    
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    // Fallback to current analysis
    return generateMoodAnalysis(url);
  }
}

// Extract Pinterest board information
function extractBoardInfo(url) {
  const urlParts = url.split('/');
  const username = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 3];
  const boardName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
  
  return {
    username,
    boardName: boardName.replace(/-/g, ' '),
    originalUrl: url
  };
}

// Fetch Pinterest data (placeholder - requires Pinterest API)
async function fetchPinterestData(boardInfo) {
  // This would use Pinterest API in production
  // For now, simulate some data structure
  return {
    board: {
      name: boardInfo.boardName,
      description: '', // Would come from API
      follower_count: 0,
      pin_count: 0
    },
    pins: [
      // Would be populated with real pin data including:
      // - image URLs
      // - descriptions
      // - titles
      // - board categories
      // - engagement metrics
    ]
  };
}

// Computer vision analysis of images
async function analyzeImagesWithCV(pins) {
  const analyses = [];
  
  for (let pin of pins.slice(0, 20)) { // Analyze first 20 pins
    try {
      const imageAnalysis = await analyzeImage(pin.image_url);
      analyses.push(imageAnalysis);
    } catch (error) {
      console.error('Image analysis failed:', error);
    }
  }
  
  return synthesizeVisualAnalysis(analyses);
}

// Analyze individual image
async function analyzeImage(imageUrl) {
  try {
    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    
    // Color analysis
    const colors = await analyzeColors(imageBuffer);
    
    // Composition analysis
    const composition = await analyzeComposition(imageBuffer);
    
    // Object detection (simplified)
    const objects = await detectObjects(imageBuffer);
    
    // Style classification
    const style = await classifyStyle(imageBuffer);
    
    return {
      colors,
      composition,
      objects,
      style,
      technical: await getTechnicalProperties(imageBuffer)
    };
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return null;
  }
}

// Advanced color analysis
async function analyzeColors(imageBuffer) {
  try {
    // Extract dominant colors
    const palette = await ColorThief.getPalette(imageBuffer, 8);
    
    // Analyze color properties
    const colorAnalysis = palette.map(color => {
      const [r, g, b] = color;
      return {
        rgb: { r, g, b },
        hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`,
        hsl: rgbToHsl(r, g, b),
        mood: getColorMood(r, g, b),
        temperature: getColorTemperature(r, g, b),
        saturation: getSaturation(r, g, b),
        brightness: getBrightness(r, g, b)
      };
    });
    
    return {
      palette: colorAnalysis,
      dominantColor: colorAnalysis[0],
      temperature: getOverallTemperature(colorAnalysis),
      harmony: analyzeColorHarmony(colorAnalysis),
      contrast: analyzeContrast(colorAnalysis)
    };
    
  } catch (error) {
    console.error('Color analysis error:', error);
    return null;
  }
}

// Composition analysis
async function analyzeComposition(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Analyze image properties
    const stats = await image.stats();
    
    return {
      aspectRatio: metadata.width / metadata.height,
      dimensions: { width: metadata.width, height: metadata.height },
      orientation: metadata.width > metadata.height ? 'landscape' : 'portrait',
      brightness: calculateOverallBrightness(stats),
      contrast: calculateContrast(stats),
      complexity: await analyzeComplexity(image),
      symmetry: await analyzeSymmetry(image)
    };
    
  } catch (error) {
    console.error('Composition analysis error:', error);
    return null;
  }
}

// Object detection (simplified)
async function detectObjects(imageBuffer) {
  // This would use a pre-trained model like MobileNet or COCO
  // For now, return placeholder data
  return {
    objects: [
      // { name: 'person', confidence: 0.9, bbox: [x, y, w, h] }
    ],
    scenes: [], // indoor, outdoor, beach, etc.
    activities: [] // reading, cooking, exercising, etc.
  };
}

// Style classification
async function classifyStyle(imageBuffer) {
  // This would classify artistic/design styles
  return {
    artisticStyle: 'modern', // modern, vintage, minimalist, etc.
    photographyStyle: 'lifestyle', // portrait, landscape, macro, etc.
    designStyle: 'clean', // clean, busy, geometric, organic, etc.
    era: '2020s', // vintage indicators
    aesthetic: 'contemporary' // boho, industrial, scandinavian, etc.
  };
}

// Text content analysis
async function analyzeTextContent(pins) {
  const allText = pins.map(pin => 
    `${pin.title || ''} ${pin.description || ''}`
  ).join(' ');
  
  return {
    sentiment: analyzeSentiment(allText),
    keywords: extractKeywords(allText),
    themes: identifyThemes(allText),
    emotions: detectEmotions(allText),
    topics: categorizeTopics(allText)
  };
}

// Sentiment analysis
function analyzeSentiment(text) {
  // Simple sentiment analysis - would use NLP library in production
  const positiveWords = ['beautiful', 'amazing', 'love', 'perfect', 'gorgeous', 'stunning', 'peaceful', 'serene', 'vibrant', 'elegant'];
  const negativeWords = ['sad', 'dark', 'gloomy', 'harsh', 'difficult', 'challenging'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  const overallScore = (positiveScore - negativeScore) / words.length;
  
  return {
    score: overallScore,
    label: overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral',
    positiveWords: positiveScore,
    negativeWords: negativeScore
  };
}

// Extract keywords
function extractKeywords(text) {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count, relevance: count / words.length }));
}

// Synthesize all analysis into comprehensive mood profile
async function synthesizeAnalysis({ boardInfo, pinterestData, visualAnalysis, textAnalysis }) {
  // Combine visual and text analysis
  const moodScores = calculateMoodScores(visualAnalysis, textAnalysis);
  const primaryMood = determinePrimaryMood(moodScores);
  
  return {
    // Enhanced mood analysis
    mood: {
      primary: primaryMood.name,
      confidence: primaryMood.confidence,
      secondary: moodScores.slice(1, 3).map(m => m.name),
      emotional_spectrum: moodScores
    },
    
    // Rich visual analysis
    visual: {
      color_palette: visualAnalysis.colors?.palette || [],
      dominant_colors: visualAnalysis.colors?.dominantColor || {},
      color_temperature: visualAnalysis.colors?.temperature || 'neutral',
      color_harmony: visualAnalysis.colors?.harmony || 'unknown',
      composition_style: getCompositionStyle(visualAnalysis),
      aesthetic_style: getAestheticStyle(visualAnalysis),
      visual_complexity: getVisualComplexity(visualAnalysis),
      lighting_mood: getLightingMood(visualAnalysis)
    },
    
    // Content analysis
    content: {
      themes: textAnalysis.themes || [],
      keywords: textAnalysis.keywords?.slice(0, 10) || [],
      sentiment: textAnalysis.sentiment || { score: 0, label: 'neutral' },
      topics: textAnalysis.topics || [],
      emotional_tone: textAnalysis.emotions || []
    },
    
    // Enhanced music recommendations
    music: {
      primary_genres: mapMoodToGenres(primaryMood.name),
      energy_level: calculateEnergyLevel(visualAnalysis, textAnalysis),
      tempo_range: getTempoRange(primaryMood.name, visualAnalysis),
      instrumental_preference: getInstrumentalPreference(visualAnalysis),
      vocal_style: getVocalStyle(textAnalysis),
      era_preference: getEraPreference(visualAnalysis)
    },
    
    // Board metadata
    board: {
      name: boardInfo.boardName,
      estimated_pins: visualAnalysis.length || 0,
      diversity_score: calculateDiversityScore(visualAnalysis),
      cohesion_score: calculateCohesionScore(visualAnalysis)
    }
  };
}

// Helper functions for mood calculation
function calculateMoodScores(visualAnalysis, textAnalysis) {
  const moods = [
    { name: 'Energetic', score: 0 },
    { name: 'Peaceful', score: 0 },
    { name: 'Romantic', score: 0 },
    { name: 'Nostalgic', score: 0 },
    { name: 'Adventurous', score: 0 },
    { name: 'Cozy', score: 0 },
    { name: 'Elegant', score: 0 },
    { name: 'Playful', score: 0 },
    { name: 'Mysterious', score: 0 },
    { name: 'Fresh', score: 0 }
  ];
  
  // Score based on visual analysis
  if (visualAnalysis.colors) {
    // Bright, saturated colors = energetic
    if (visualAnalysis.colors.temperature === 'warm') {
      moods.find(m => m.name === 'Energetic').score += 0.3;
      moods.find(m => m.name === 'Cozy').score += 0.2;
    }
    
    // Cool colors = peaceful
    if (visualAnalysis.colors.temperature === 'cool') {
      moods.find(m => m.name === 'Peaceful').score += 0.3;
      moods.find(m => m.name === 'Fresh').score += 0.2;
    }
  }
  
  // Score based on text analysis
  if (textAnalysis.sentiment?.score > 0.5) {
    moods.find(m => m.name === 'Playful').score += 0.2;
    moods.find(m => m.name === 'Fresh').score += 0.2;
  }
  
  // Add randomness to prevent identical results
  moods.forEach(mood => {
    mood.score += Math.random() * 0.1;
    mood.confidence = Math.min(mood.score, 1.0);
  });
  
  return moods.sort((a, b) => b.score - a.score);
}

function determinePrimaryMood(moodScores) {
  const primary = moodScores[0];
  return {
    name: primary.name,
    confidence: primary.confidence
  };
}

// Music mapping functions
function mapMoodToGenres(mood) {
  const moodGenreMap = {
    'Energetic': ['electronic', 'pop', 'rock', 'dance', 'funk'],
    'Peaceful': ['ambient', 'classical', 'folk', 'new age', 'acoustic'],
    'Romantic': ['jazz', 'soul', 'r&b', 'indie folk', 'classical'],
    'Nostalgic': ['vintage', 'oldies', 'folk', 'country', 'classic rock'],
    'Adventurous': ['world', 'rock', 'electronic', 'indie', 'alternative'],
    'Cozy': ['indie folk', 'acoustic', 'jazz', 'lo-fi', 'singer-songwriter'],
    'Elegant': ['classical', 'jazz', 'opera', 'chamber music', 'minimal'],
    'Playful': ['pop', 'indie pop', 'funk', 'ska', 'alternative'],
    'Mysterious': ['dark ambient', 'post-rock', 'experimental', 'electronic'],
    'Fresh': ['indie', 'pop', 'electronic', 'alternative', 'new wave']
  };
  
  return moodGenreMap[mood] || ['pop', 'indie', 'alternative'];
}

// Color analysis helper functions
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getColorMood(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  
  if (s < 20) return 'neutral';
  if (l > 80) return 'light';
  if (l < 20) return 'dark';
  if (h >= 0 && h < 60) return 'energetic'; // red-orange
  if (h >= 60 && h < 120) return 'fresh'; // yellow-green
  if (h >= 120 && h < 180) return 'calming'; // green-cyan
  if (h >= 180 && h < 240) return 'peaceful'; // cyan-blue
  if (h >= 240 && h < 300) return 'mysterious'; // blue-purple
  return 'romantic'; // purple-red
}

module.exports = {
  enhancedAnalyzePinterestBoard,
  analyzeImage,
  analyzeColors,
  analyzeSentiment,
  synthesizeAnalysis
};
