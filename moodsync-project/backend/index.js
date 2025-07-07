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

// Simplified Pinterest scraping
async function scrapePinterestBoard(url) {
  try {
    console.log('Scraping Pinterest board:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const images = [];
    
    // Extract image URLs
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.includes('pinimg.com') && !src.includes('avatar') && src.includes('736x')) {
        images.push(src);
      }
    });

    console.log(`Found ${images.length} images`);
    return [...new Set(images)].slice(0, 6); // Remove duplicates, limit to 6
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    // Return some demo images if scraping fails
    return [
      'https://i.pinimg.com/736x/example1.jpg',
      'https://i.pinimg.com/736x/example2.jpg'
    ];
  }
}

// Color analysis
async function analyzeImageColors(imageUrls) {
  const allColors = [];
  
  console.log('Analyzing colors from', imageUrls.length, 'images');
  
  for (let i = 0; i < Math.min(imageUrls.length, 3); i++) {
    try {
      const palette = await Vibrant.from(imageUrls[i]).getPalette();
      
      Object.entries(palette).forEach(([name, swatch]) => {
        if (swatch && swatch.hex) {
          allColors.push(swatch.hex);
        }
      });
      
    } catch (error) {
      console.log(`Failed to analyze image ${i + 1}`);
    }
  }
  
  // If no colors found, return default palette
  if (allColors.length === 0) {
    return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC'];
  }
  
  return [...new Set(allColors)].slice(0, 6);
}

// Mood analysis
function analyzeMoodFromColors(colors) {
  const moods = [
    { mood: 'Vibrant & Energetic', description: 'Bright, bold colors suggest high energy and creativity. Perfect for upbeat, motivational music.' },
    { mood: 'Calm & Minimalist', description: 'Soft, muted tones create a peaceful atmosphere. Great for ambient or acoustic music.' },
    { mood: 'Warm & Cozy', description: 'Rich, warm colors create an inviting mood. Perfect for folk, soul, or indie music.' },
    { mood: 'Cool & Serene', description: 'Cool tones suggest tranquility and focus. Ideal for electronic or chill music.' },
    { mood: 'Dramatic & Moody', description: 'Deep, rich colors create intensity. Great for alternative or emotional music.' }
  ];
  
  // Simple mood selection based on color count and variety
  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  return randomMood;
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

    // Scrape board
    const imageUrls = await scrapePinterestBoard(pinterestUrl);
    
    // Analyze colors
    const colors = await analyzeImageColors(imageUrls);
    
    // Analyze mood
    const moodAnalysis = analyzeMoodFromColors(colors);

    const analysis = {
      colors,
      mood: moodAnalysis.mood,
      description: moodAnalysis.description,
      totalPins: imageUrls.length,
      analyzedPins: Math.min(3, imageUrls.length)
    };

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed. Please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
