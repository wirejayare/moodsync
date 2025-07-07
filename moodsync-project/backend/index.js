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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
