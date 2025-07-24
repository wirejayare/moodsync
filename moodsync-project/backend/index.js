const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const spotify = require('./spotify');
const pinterest = require('./pinterest');
const ai = require('./ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://moodsync-jw.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'MoodSync Backend API',
    status: 'Running',
    version: '3.0.0',
    endpoints: [
      '/health',
      '/api/spotify/auth-url',
      '/api/spotify/callback',
      '/api/pinterest/auth-url',
      '/api/pinterest/callback',
      '/api/pinterest/boards',
      '/api/pinterest/boards/:boardId',
      '/api/analyze-pinterest',
      '/api/create-playlist'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MoodSync Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    spotify_configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    pinterest_configured: !!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET),
    frontend_url: process.env.FRONTEND_URL
  });
});

// --- Analyze Pinterest Enhanced Endpoint ---
app.post('/api/analyze-pinterest-enhanced', async (req, res) => {
  console.log('🟡 [DEBUG] Incoming analyze-pinterest-enhanced req.body:', req.body);
  try {
    const { boardUrl } = req.body;
    if (!boardUrl) {
      return res.status(400).json({ error: 'Missing boardUrl in request body' });
    }

    // Extract board info (implement this in pinterest.js)
    let boardInfo;
    try {
      boardInfo = await pinterest.extractBoardInfo(boardUrl);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to extract board info', details: err.message });
    }

    // Get image URLs from boardInfo (assume boardInfo.images or similar)
    const imageUrls = boardInfo && boardInfo.images ? boardInfo.images : [];

    // Call Claude Vision AI
    let aiResponse;
    try {
      aiResponse = await ai.generateClaudeRecommendations(imageUrls, boardInfo, process.env.ANTHROPIC_API_KEY);
    } catch (err) {
      return res.status(500).json({ error: 'AI reasoning failed', details: err.message });
    }

    // Return AI reasoning and recommendations
    res.json({
      ai_reasoning: aiResponse,
      board_info: boardInfo
    });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error', details: err.message });
  }
});

// --- Spotify Endpoints ---
// Example: Auth URL (stub, replace with real logic as needed)
app.get('/api/spotify/auth-url', (req, res) => {
  // TODO: Implement Spotify auth URL logic
  res.json({ url: 'https://accounts.spotify.com/authorize?...' });
});

// Example: Spotify callback (stub)
app.get('/api/spotify/callback', (req, res) => {
  // TODO: Implement Spotify callback logic
  res.json({ success: true });
});

// Example: Create playlist (stub)
app.post('/api/create-playlist', async (req, res) => {
  // TODO: Implement playlist creation logic using spotify.createSpotifyPlaylist
  res.json({ success: true });
});

// --- Pinterest Endpoints ---
app.get('/api/pinterest/auth-url', (req, res) => {
  // TODO: Implement Pinterest auth URL logic
  res.json({ url: 'https://www.pinterest.com/oauth/?...' });
});

app.get('/api/pinterest/callback', (req, res) => {
  // TODO: Implement Pinterest callback logic
  res.json({ success: true });
});

app.get('/api/pinterest/boards', async (req, res) => {
  // TODO: Implement getUserBoards logic
  res.json({ boards: [] });
});

app.get('/api/pinterest/boards/:boardId', async (req, res) => {
  // TODO: Implement getBoardById logic
  res.json({ board: {} });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`MoodSync backend running on port ${PORT}`);
});
