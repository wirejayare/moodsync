const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
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
    endpoints: ['/health', '/api/spotify/auth-url', '/api/spotify/callback', '/api/analyze-pinterest', '/api/create-playlist']
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

// Spotify auth URL
app.get('/api/spotify/auth-url', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&` +
    `scope=playlist-modify-public playlist-modify-private user-read-private user-read-email`;
  
  res.json({ authUrl });
});

// Exchange Spotify code for access token
app.post('/api/spotify/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    res.json({
      success: true,
      access_token,
      refresh_token,
      user: userResponse.data
    });

  } catch (error) {
    console.error('Spotify callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to authenticate with Spotify' 
    });
  }
});

// Pinterest board analysis (existing function)
async function analyzePinterestBoard(url) {
  try {
    console.log('Analyzing Pinterest board:', url);
    
    const urlParts = url.split('/');
    const boardName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    const analysis = g
