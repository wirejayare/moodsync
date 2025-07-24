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

// --- Spotify Endpoints ---
app.get('/api/spotify/auth-url', (req, res) => {
  if (!process.env.SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ success: false, message: 'Spotify client ID not configured' });
  }
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&` +
    `scope=playlist-modify-public playlist-modify-private user-read-private user-read-email`;
  res.json({ authUrl });
});

app.post('/api/spotify/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Authorization code required' });
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ success: false, message: 'Spotify credentials not configured' });
    }
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token } = tokenResponse.data;
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    res.json({ success: true, access_token, refresh_token, user: userResponse.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to authenticate with Spotify', error: error.response?.data?.error_description || error.message });
  }
});

// --- Pinterest Endpoints ---
app.get('/api/pinterest/auth-url', (req, res) => {
  if (!process.env.PINTEREST_CLIENT_ID) {
    return res.status(500).json({ success: false, message: 'Pinterest client ID not configured' });
  }
  const authUrl = `https://www.pinterest.com/oauth/?` +
    `client_id=${process.env.PINTEREST_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=boards:read,pins:read,user_accounts:read`;
  res.json({ authUrl });
});

app.post('/api/pinterest/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'No authorization code provided' });
    // ... (Pinterest OAuth logic, as in your modular code)
    res.json({ success: true, access_token: '...', user: { username: '...', full_name: '...', id: '...' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error during Pinterest authentication' });
  }
});

app.get('/api/pinterest/boards', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Pinterest access token required' });
    }
    const accessToken = authHeader.substring(7);
    const boards = await pinterest.getUserBoards(accessToken);
    res.json({ success: true, boards, total: boards.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch boards', error: error.message });
  }
});

app.get('/api/pinterest/boards/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Pinterest access token required' });
    }
    const accessToken = authHeader.substring(7);
    const board = await pinterest.getBoardById(boardId, accessToken);
    res.json({ success: true, board, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch board details', error: error.message });
  }
});

// --- Analysis Endpoints (Claude Vision) ---
app.post('/api/analyze-pinterest', async (req, res) => {
  try {
    const { url, imageUrls } = req.body;
    const boardInfo = await pinterest.extractBoardInfo(url);
    const result = await ai.generateClaudeRecommendations(imageUrls || [], boardInfo, process.env.ANTHROPIC_API_KEY);
    res.json({ success: true, ai_reasoning: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI analysis failed', error: error.message });
  }
});

// --- Playlist Creation Endpoint ---
app.post('/api/create-playlist', async (req, res) => {
  try {
    const { accessToken, userId, name, description, trackUris } = req.body;
    const playlist = await spotify.createSpotifyPlaylist(accessToken, userId, name, description, trackUris);
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create playlist', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`MoodSync backend running on port ${PORT}`);
}); 