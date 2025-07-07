const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const Vibrant = require('node-vibrant');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodSync Backend API',
    status: 'Running',
    endpoints: ['/health', '/api/spotify/auth-url', '/api/analyze-pinterest']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MoodSync Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Spotify auth route
app.get('/api/spotify/auth-url', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&` +
    `scope=playlist-modify-public playlist-modify-private user-read-private`;
  
  res.json({ authUrl });
});

// Pinterest scraping function
async function scrapePinterestBoard(url) {
  try {
    console.log('Scraping Pinterest board:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const images = [];
    
    // Look for Pinterest image patterns
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && (src.includes('pinimg.com') || src.includes('pinterest.com')) && !src.includes('avatar')) {
        // Clean up the URL and get higher quality version
        let imageUrl = src;
        if (src.includes('/236x/')) {
          imageUrl = src.replace('/236x/', '/736x/');
        }
        if (src.includes('/474x/')) {
          imageUrl = src.replace('/474x/', '/736x/');
        }
        images.push(imageUrl);
      }
    });

    console.log(`Found ${images.length} images`);
    
    // Remove duplicates and limit
    const uniqueImages = [...new Set(images)];
    return uniqueImages.slice(0, 8);
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw new Error('Failed to access Pinterest board - it may be private or the URL is incorrect');
  }
}

// Color analysis function
async function analyzeImageColors(imageUrls) {
  const allColors = [];
  const colorCounts = {};
  
  console.log('Analyzing colors from', imageUrls.length, 'images');
  
  for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
    const imageUrl = imageUrls[i];
    try {
      console.log(`Analyzing image ${i + 1}:`, imageUrl);
      
      const palette = await Vibrant.from(imageUrl).getPalette();
      
      Object.entries(palette).forEach(([name, swatch]) => {
        if (swatch && swatch.hex) {
          const hex = swatch.hex;
          colorCounts[hex] = (colorCounts[hex] || 0) + swatch.population;
          
          if (!allColors.find(c => c.hex === hex)) {
            allColors.push({
              hex,
              name,
              population: swatch.population
            });
          }
        }
      });
      
    } catch (error) {
      console.log(`Failed to analyze image ${i + 1}:`, error.message);
    }
  }
  
  // Sort by popularity and return top colors
  const topColors = allColors
    .sort((a, b) => (colorCounts[b.hex] || 0) - (colorCounts[a.hex] || 0))
    .slice(0, 6)
    .map(color => color.hex);
    
  console.log('Extracted colors:', topColors);
  return topColors;
}

// Mood analysis function
function analyzeMoodFromColors(colors) {
  if (!colors.length) return { mood: 'Neutral', description: 'No colors detected from this board.' };
  
  // Convert hex to HSL for analysis
  const colorData = colors.map(hex => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { hex, hsl };
  }).filter(Boolean);
  
  if (!colorData.length) return { mood: 'Neutral', description: 'Unable to analyze colors.' };
  
  // Calculate average properties
  const avgSaturation = colorData.reduce((sum, c) => sum + c.hsl[1], 0) / colorData.length;
  const avgLightness = colorData.reduce((sum, c) => sum + c.hsl[2], 0) / colorData.length;
  const avgHue = colorData.reduce((sum, c) => sum + c.hsl[0], 0) / colorData.length;
  
  // Determine mood based on color theory
  let mood, description;
  
  if (avgSaturation > 0.6 && avgLightness > 0.5) {
    mood = 'Vibrant & Energetic';
    description = 'Bright, bold colors dominate this moodboard, suggesting high energy, creativity, and optimism. Perfect for upbeat, motivational music.';
  } else if (avgSaturation < 0.3 || avgLightness > 0.8) {
    mood = 'Calm & Minimalist';
    description = 'Soft, muted tones create a peaceful and sophisticated atmosphere. This palette suggests tranquil, ambient, or acoustic music.';
  } else if (avgLightness < 0.4) {
    mood = 'Dramatic & Moody';
    description = 'Dark, rich colors create an intense and dramatic mood. This aesthetic pairs well with deep, emotional, or alternative music.';
  } else if (avgHue < 0.15 || avgHue > 0.9) { // Reds/warm colors
    mood = 'Warm & Passionate';
    description = 'Warm reds and oranges create a passionate, cozy atmosphere. This suggests romantic, soulful, or folk music.';
  } else if (avgHue > 0.15 && avgHue < 0.7) { // Greens/blues
    mood = 'Cool & Serene';
    description = 'Cool blues and greens create a serene, natural feeling. This palette suggests chill, electronic, or nature-inspired music.';
  } else {
    mood = 'Balanced & Harmonious';
    description = 'A well-balanced mix of colors creates a harmonious mood that\'s both calming and inspiring. Perfect for indie or alternative music.';
  }
  
  return { mood, description };
}

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
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
  return [h, s, l];
}

// Pinterest analysis endpoint
app.post('/api/analyze-pinterest', async (req, res) => {
  try {
    const { pinterestUrl } = req.body;
    
    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting analysis for:', pinterestUrl);

    // Step 1: Scrape the Pinterest board
    const imageUrls = await scrapePinterestBoard(pinterestUrl);
    
    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images found. The board might be private or empty.'
      });
    }

    // Step 2: Extract colors from images
    const colors = await analyzeImageColors(imageUrls);
    
    if (colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract colors from the images.'
      });
    }

    // Step 3: Analyze mood based on colors
    const moodAnalysis = analyzeMoodFromColors(colors);

    const analysis = {
      colors,
      mood: moodAnalysis.mood,
      description: moodAnalysis.description,
      totalPins: imageUrls.length,
      analyzedPins: Math.min(5, imageUrls.length)
    };

    console.log('Analysis complete:', { colorsFound: colors.length, mood: moodAnalysis.mood });

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Analysis failed. Please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /health');
  console.log('- GET /api/spotify/auth-url');
  console.log('- POST /api/analyze-pinterest');
});
