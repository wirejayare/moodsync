// spotify.js
const axios = require('axios');

// Cache for client credentials token
let clientCredentialsToken = null;
let tokenExpiry = 0;

// Get client credentials token for server-to-server API calls
async function getClientCredentialsToken() {
  try {
    // Check if we have a valid cached token
    if (clientCredentialsToken && Date.now() < tokenExpiry) {
      return clientCredentialsToken;
    }

    console.log('🔑 Getting new client credentials token...');

    // Check if credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured');
      throw new Error('Spotify credentials not configured');
    }

    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = response.data;

    // Cache the token with expiry
    clientCredentialsToken = access_token;
    tokenExpiry = Date.now() + (expires_in * 1000) - 60000; // Expire 1 minute early

    console.log('✅ Client credentials token obtained');
    return access_token;

  } catch (error) {
    console.error('❌ Client credentials error:', error.response?.data || error.message);
    throw new Error('Failed to get client credentials token');
  }
}

// Search tracks using client credentials (for previews)
async function searchTracksWithClientCredentials(genres, limit = 15, searchTerms = []) {
  // ... function body from index.js ...
}

// Enhanced track search for mood/genre
async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  // ... function body from index.js ...
}

// Create Spotify playlist
async function createSpotifyPlaylist(accessToken, userId, name, description, trackUris) {
  // ... function body from index.js ...
}

// Helper functions
function getRandomMood() { /* ... */ }
function getRandomYearRange() { /* ... */ }
function getRandomPopularityRange() { /* ... */ }
function getRandomTempoRange() { /* ... */ }
function getRandomEnergyLevel() { /* ... */ }
function getRandomAcousticness() { /* ... */ }
function getRandomDanceability() { /* ... */ }
function getGenreArtists(genre) { /* ... */ }

module.exports = {
  getClientCredentialsToken,
  searchTracksWithClientCredentials,
  searchTracksForMood,
  createSpotifyPlaylist,
  getRandomMood,
  getRandomYearRange,
  getRandomPopularityRange,
  getRandomTempoRange,
  getRandomEnergyLevel,
  getRandomAcousticness,
  getRandomDanceability,
  getGenreArtists
}; 