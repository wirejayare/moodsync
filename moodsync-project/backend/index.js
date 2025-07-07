const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MoodSync Backend is running!',
    timestamp: new Date().toISOString()
  });
});
// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodSync Backend API',
    status: 'Running',
    endpoints: ['/health', '/api/spotify/auth-url']
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
// Pinterest analysis route
app.post('/api/analyze-pinterest', async (req, res) => {
  try {
    const { pinterestUrl } = req.body;
    
    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Valid Pinterest URL required'
      });
    }

    // For now, return mock analysis data
    // We'll add real Pinterest scraping next
    const mockAnalysis = {
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC'],
      mood: 'Vibrant and Energetic',
      description: 'This moodboard features bright, bold colors with a modern aesthetic. The palette suggests high energy and creativity.',
      totalPins: 25,
      analyzedPins: 10
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({
      success: true,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error('Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed'
    });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
