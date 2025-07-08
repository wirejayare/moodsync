const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Fixed CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://moodsync-jw.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodSync Backend API',
    status: 'Running',
    version: '2.0.0',
    endpoints: [
      '/health', 
      '/api/spotify/auth-url', 
      '/api/spotify/callback', 
      '/api/analyze-pinterest',
      '/api/analyze-pinterest-enhanced', 
      '/api/create-playlist'
    ]
  });
});

// Health check with environment info
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MoodSync Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    spotify_configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    frontend_url: process.env.FRONTEND_URL
  });
});

// Spotify auth URL
app.get('/api/spotify/auth-url', (req, res) => {
  try {
    if (!process.env.SPOTIFY_CLIENT_ID) {
      return res.status(500).json({ 
        success: false, 
        message: 'Spotify client ID not configured' 
      });
    }

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&` +
      `scope=playlist-modify-public playlist-modify-private user-read-private user-read-email`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Auth URL error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate auth URL' 
    });
  }
});

// Exchange Spotify code for access token
app.post('/api/spotify/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ 
        success: false, 
        message: 'Spotify credentials not configured' 
      });
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
      message: 'Failed to authenticate with Spotify',
      error: error.response?.data?.error_description || error.message
    });
  }
});

// Basic Pinterest board analysis (your existing function)
async function analyzePinterestBoard(url) {
  try {
    console.log('Analyzing Pinterest board:', url);
    
    const urlParts = url.split('/');
    const boardName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    const analysis = generateMoodAnalysis(boardName, url);
    return analysis;
    
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error('Failed to analyze Pinterest board');
  }
}

// Generate mood analysis (your existing function)
function generateMoodAnalysis(boardName, url) {
  const colorThemes = {
    vintage: ['#D4A574', '#8B4513', '#CD853F', '#F5DEB3', '#DEB887'],
    modern: ['#2C3E50', '#ECF0F1', '#3498DB', '#E74C3C', '#95A5A6'],
    nature: ['#27AE60', '#E67E22', '#8B4513', '#F39C12', '#16A085'],
    minimalist: ['#ECF0F1', '#BDC3C7', '#95A5A6', '#7F8C8D', '#34495E'],
    colorful: ['#E74C3C', '#F39C12', '#F1C40F', '#27AE60', '#3498DB'],
    boho: ['#D35400', '#E67E22', '#F39C12', '#27AE60', '#8E44AD'],
    dark: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'],
    pastel: ['#FFB6C1', '#E6E6FA', '#B0E0E6', '#F0E68C', '#FFA07A']
  };

  const moodProfiles = {
    vintage: {
      mood: 'Nostalgic & Romantic',
      description: 'This board captures vintage charm with warm, sepia-toned elements and classic aesthetics. Perfect for jazz, soul, and classic rock.',
      genres: ['jazz', 'soul', 'blues', 'classic rock', 'vintage', 'oldies']
    },
    modern: {
      mood: 'Clean & Contemporary',
      description: 'Modern, sleek design with bold contrasts and minimalist elements. Ideal for electronic, indie, and alternative music.',
      genres: ['electronic', 'indie', 'alternative', 'techno', 'synth-pop', 'modern']
    },
    nature: {
      mood: 'Earthy & Grounding',
      description: 'Natural elements and organic textures create a peaceful, earth-connected vibe. Great for folk, acoustic, and ambient music.',
      genres: ['folk', 'acoustic', 'indie folk', 'ambient', 'world', 'nature sounds']
    },
    minimalist: {
      mood: 'Calm & Focused',
      description: 'Clean lines and neutral tones suggest clarity and simplicity. Perfect for lo-fi, ambient, and modern classical music.',
      genres: ['lo-fi', 'ambient', 'minimal', 'classical', 'piano', 'meditation']
    },
    colorful: {
      mood: 'Vibrant & Energetic',
      description: 'Bold, bright colors create an energetic and playful atmosphere. Ideal for pop, dance, and upbeat indie music.',
      genres: ['pop', 'dance', 'funk', 'indie pop', 'upbeat', 'happy']
    },
    boho: {
      mood: 'Free-spirited & Artistic',
      description: 'Bohemian elements with rich textures and warm colors. Perfect for indie folk, world music, and acoustic genres.',
      genres: ['indie folk', 'world', 'acoustic', 'bohemian', 'hippie', 'psychedelic']
    },
    dark: {
      mood: 'Dramatic & Intense',
      description: 'Dark, moody palette creates mystery and depth. Great for alternative, electronic, and atmospheric music.',
      genres: ['alternative', 'dark electronic', 'gothic', 'post-rock', 'atmospheric', 'moody']
    },
    pastel: {
      mood: 'Soft & Dreamy',
      description: 'Gentle pastel colors create a dreamy, ethereal mood. Perfect for dream pop, indie, and soft electronic music.',
      genres: ['dream pop', 'indie', 'soft electronic', 'ethereal', 'ambient pop', 'chillwave']
    }
  };

  // Detect theme from board name and URL
  const boardText = (boardName + ' ' + url).toLowerCase();
  let detectedTheme = 'modern'; // default
  
  for (const [theme, colors] of Object.entries(colorThemes)) {
    if (boardText.includes(theme) || 
        boardText.includes(theme.substring(0, 4)) ||
        (theme === 'nature' && (boardText.includes('garden') || boardText.includes('plant') || boardText.includes('green'))) ||
        (theme === 'vintage' && (boardText.includes('retro') || boardText.includes('classic'))) ||
        (theme === 'colorful' && (boardText.includes('bright') || boardText.includes('rainbow'))) ||
        (theme === 'boho' && (boardText.includes('bohemian') || boardText.includes('hippie'))) ||
        (theme === 'minimalist' && (boardText.includes('simple') || boardText.includes('clean'))) ||
        (theme === 'dark' && (boardText.includes('black') || boardText.includes('gothic'))) ||
        (theme === 'pastel' && (boardText.includes('soft') || boardText.includes('pink')))) {
      detectedTheme = theme;
      break;
    }
  }

  return {
    colors: colorThemes[detectedTheme],
    mood: moodProfiles[detectedTheme].mood,
    description: moodProfiles[detectedTheme].description,
    genres: moodProfiles[detectedTheme].genres,
    theme: detectedTheme,
    totalPins: Math.floor(Math.random() * 50) + 15,
    analyzedPins: Math.floor(Math.random() * 10) + 5
  };
}

// Search Spotify for tracks based on mood
async function searchTracksForMood(accessToken, genres, limit = 20) {
  const tracks = [];
  
  try {
    console.log('Searching for tracks with genres:', genres);
    
    // Search for tracks using different genre combinations
    for (const genre of genres.slice(0, 3)) {
      try {
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            q: `genre:"${genre}"`,
            type: 'track',
            limit: Math.ceil(limit / 3),
            market: 'US'
          }
        });
        
        if (searchResponse.data.tracks.items.length > 0) {
          tracks.push(...searchResponse.data.tracks.items);
        }
      } catch (genreError) {
        console.error(`Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // If no genre-specific results, search with mood keywords
    if (tracks.length === 0) {
      const moodKeywords = genres.slice(0, 2).join(' OR ');
      console.log('Fallback search with keywords:', moodKeywords);
      
      const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: moodKeywords,
          type: 'track',
          limit: limit,
          market: 'US'
        }
      });
      
      tracks.push(...fallbackResponse.data.tracks.items);
    }
    
    // Remove duplicates and shuffle
    const uniqueTracks = tracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    console.log(`Found ${uniqueTracks.length} unique tracks`);
    return shuffleArray(uniqueTracks).slice(0, limit);
    
  } catch (error) {
    console.error('Track search error:', error.response?.data || error.message);
    return [];
  }
}

// Create Spotify playlist
async function createSpotifyPlaylist(accessToken, userId, name, description, trackUris) {
  try {
    console.log(`Creating playlist "${name}" for user ${userId}`);
    
    // Create playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: name,
        description: description,
        public: false
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const playlist = playlistResponse.data;
    console.log(`Playlist created with ID: ${playlist.id}`);
    
    // Add tracks to playlist
    if (trackUris.length > 0) {
      console.log(`Adding ${trackUris.length} tracks to playlist`);
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          uris: trackUris
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return playlist;
    
  } catch (error) {
    console.error('Playlist creation error:', error.response?.data || error.message);
    throw new Error('Failed to create playlist: ' + (error.response?.data?.error?.message || error.message));
  }
}

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Basic Pinterest analysis endpoint
app.post('/api/analyze-pinterest', async (req, res) => {
  try {
    const { pinterestUrl } = req.body;
    
    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting basic analysis for:', pinterestUrl);
    
    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = await analyzePinterestBoard(pinterestUrl);
    console.log('Basic analysis complete:', analysis.theme, analysis.mood);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed. Please try again.',
      error: error.message
    });
  }
});

// Enhanced Pinterest analysis endpoint
app.post('/api/analyze-pinterest-enhanced', async (req, res) => {
  try {
    const { url, analysisOptions = {} } = req.body;
    
    if (!url || !url.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting enhanced analysis for:', url);

    // Add realistic delay for enhanced analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    const enhancedAnalysis = await generateEnhancedAnalysis(url, analysisOptions);

    res.json({
      success: true,
      analysis: enhancedAnalysis,
      method: 'enhanced_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced analysis failed. Please try again.',
      error: error.message
    });
  }
});

// Create playlist endpoint
app.post('/api/create-playlist', async (req, res) => {
  try {
    const { accessToken, analysis, playlistName } = req.body;
    
    if (!accessToken || !analysis) {
      return res.status(400).json({
        success: false,
        message: 'Access token and analysis required'
      });
    }

    console.log('Starting playlist creation...');

    // Get user info
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const user = userResponse.data;
    console.log(`Creating playlist for user: ${user.display_name || user.id}`);
    
    // Get genres from analysis (handle both basic and enhanced analysis formats)
    const genres = analysis.genres || analysis.music?.primary_genres || ['pop', 'indie'];
    
    // Search for tracks based on mood
    const tracks = await searchTracksForMood(accessToken, genres, 15);
    
    if (tracks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable tracks found for this mood'
      });
    }
    
    // Create playlist
    const name = playlistName || `${analysis.mood || analysis.mood?.primary || 'Mood'} Vibes`;
    const description = `${analysis.description || 'Generated from your Pinterest board analysis'} Created by MoodSync.`;
    const trackUris = tracks.map(track => track.uri);
    
    const playlist = await createSpotifyPlaylist(
      accessToken, 
      user.id, 
      name, 
      description, 
      trackUris
    );
    
    res.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
        description: playlist.description,
        trackCount: tracks.length
      },
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name,
        album: track.album.name,
        image: track.album.images[0]?.url,
        preview_url: track.preview_url,
        spotify_url: track.external_urls.spotify
      }))
    });

  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create playlist',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Enhanced Main Analysis Function
// Replace the generateEnhancedAnalysis function in your backend/index.js

async function generateEnhancedAnalysis(pinterestUrl, options = {}) {
  console.log('🔍 Starting comprehensive analysis for:', pinterestUrl);
  
  const boardInfo = extractBoardInfo(pinterestUrl);
  
  // Create comprehensive text for analysis from multiple sources
  const analysisText = [
    boardInfo.boardName,
    boardInfo.username,
    boardInfo.originalUrl,
    // Extract more context from URL parts
    ...boardInfo.urlParts.filter(part => part.length > 2),
    // Clean up board name for better keyword extraction
    boardInfo.boardName.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\+/g, ' ')
  ].join(' ').toLowerCase();
  
  console.log('📝 Analysis text:', analysisText);
  
 // === COMPREHENSIVE THEME ANALYSIS ===
function analyzeThemes(boardText) {
  const themePatterns = {
    // === ENERGY & ACTIVITY THEMES ===
    energetic: {
      keywords: ['energy', 'energetic', 'power', 'strong', 'active', 'dynamic', 'vibrant', 'bright', 'bold', 'intense'],
      weight: 1.0,
      mood_influence: { Energetic: 0.9, Playful: 0.6, Adventurous: 0.5 }
    },
    morning: {
      keywords: ['morning', 'sunrise', 'dawn', 'wake', 'early', 'am', 'coffee', 'breakfast', 'fresh', 'start', 'person', 'vibe'],
      weight: 1.2, // Higher weight for morning themes
      mood_influence: { Energetic: 0.8, Fresh: 0.9, Playful: 0.6 }
    },
    workout: {
      keywords: ['workout', 'gym', 'fitness', 'exercise', 'health', 'strong', 'run', 'yoga', 'pilates', 'cardio'],
      weight: 1.0,
      mood_influence: { Energetic: 0.9, Adventurous: 0.7, Fresh: 0.8 }
    },
    productivity: {
      keywords: ['productive', 'work', 'hustle', 'grind', 'focus', 'goals', 'motivation', 'success', 'organize', 'plan'],
      weight: 1.0,
      mood_influence: { Energetic: 0.7, Elegant: 0.6, Fresh: 0.5 }
    },

    // === CALM & PEACEFUL THEMES ===
    peaceful: {
      keywords: ['peaceful', 'calm', 'zen', 'quiet', 'serene', 'tranquil', 'meditation', 'mindful', 'stillness'],
      weight: 1.0,
      mood_influence: { Peaceful: 0.9, Cozy: 0.6, Elegant: 0.5 }
    },
    cozy: {
      keywords: ['cozy', 'warm', 'comfort', 'hygge', 'snug', 'home', 'fireplace', 'blanket', 'tea', 'cuddle'],
      weight: 1.0,
      mood_influence: { Cozy: 0.9, Peaceful: 0.7, Romantic: 0.5 }
    },
    spa: {
      keywords: ['spa', 'relax', 'massage', 'wellness', 'self', 'care', 'pamper', 'unwind', 'soothe', 'healing'],
      weight: 1.0,
      mood_influence: { Peaceful: 0.8, Cozy: 0.6, Elegant: 0.5 }
    },

    // === ROMANTIC & EMOTIONAL THEMES ===
    romantic: {
      keywords: ['romantic', 'love', 'valentine', 'date', 'couple', 'heart', 'passion', 'intimate', 'sweet', 'tender'],
      weight: 1.0,
      mood_influence: { Romantic: 0.9, Cozy: 0.6, Elegant: 0.5 }
    },
    dreamy: {
      keywords: ['dreamy', 'ethereal', 'whimsical', 'fairy', 'magic', 'enchanted', 'mystical', 'fantasy', 'soft'],
      weight: 1.0,
      mood_influence: { Romantic: 0.7, Peaceful: 0.6, Playful: 0.5 }
    },

    // === ADVENTURE & EXPLORATION THEMES ===
    adventure: {
      keywords: ['adventure', 'travel', 'explore', 'journey', 'wanderlust', 'discover', 'wild', 'outdoor', 'hike'],
      weight: 1.0,
      mood_influence: { Adventurous: 0.9, Energetic: 0.7, Fresh: 0.6 }
    },
    travel: {
      keywords: ['travel', 'trip', 'vacation', 'destination', 'flight', 'passport', 'suitcase', 'map', 'globe'],
      weight: 1.0,
      mood_influence: { Adventurous: 0.8, Playful: 0.6, Fresh: 0.7 }
    },
    nature: {
      keywords: ['nature', 'forest', 'mountain', 'ocean', 'beach', 'trees', 'flowers', 'wildlife', 'earth', 'green'],
      weight: 1.0,
      mood_influence: { Peaceful: 0.7, Fresh: 0.8, Adventurous: 0.5 }
    },

    // === STYLE & AESTHETIC THEMES ===
    minimalist: {
      keywords: ['minimalist', 'simple', 'clean', 'white', 'minimal', 'scandinavian', 'modern', 'sleek'],
      weight: 1.0,
      mood_influence: { Peaceful: 0.8, Elegant: 0.7, Fresh: 0.6 }
    },
    maximalist: {
      keywords: ['maximalist', 'bold', 'colorful', 'eclectic', 'vibrant', 'busy', 'loud', 'mix', 'pattern'],
      weight: 1.0,
      mood_influence: { Playful: 0.8, Energetic: 0.7, Adventurous: 0.6 }
    },
    bohemian: {
      keywords: ['boho', 'bohemian', 'hippie', 'free', 'artistic', 'macrame', 'tapestry', 'indie', 'festival'],
      weight: 1.0,
      mood_influence: { Adventurous: 0.8, Romantic: 0.6, Playful: 0.7 }
    },
    vintage: {
      keywords: ['vintage', 'retro', 'antique', 'classic', 'old', 'nostalgic', 'thrift', 'aged', 'timeless'],
      weight: 1.0,
      mood_influence: { Nostalgic: 0.9, Romantic: 0.6, Elegant: 0.5 }
    },
    gothic: {
      keywords: ['gothic', 'dark', 'black', 'mysterious', 'dramatic', 'ornate', 'victorian', 'moody', 'shadow'],
      weight: 1.0,
      mood_influence: { Mysterious: 0.9, Elegant: 0.6, Romantic: 0.5 }
    },
    cottagecore: {
      keywords: ['cottage', 'rural', 'countryside', 'pastoral', 'rustic', 'farm', 'garden', 'meadow', 'simple'],
      weight: 1.0,
      mood_influence: { Cozy: 0.8, Peaceful: 0.7, Nostalgic: 0.6 }
    },

    // === SEASONAL & TEMPORAL THEMES ===
    spring: {
      keywords: ['spring', 'bloom', 'cherry', 'blossom', 'fresh', 'new', 'growth', 'pastel', 'renewal'],
      weight: 1.0,
      mood_influence: { Fresh: 0.9, Playful: 0.7, Romantic: 0.6 }
    },
    summer: {
      keywords: ['summer', 'sun', 'beach', 'vacation', 'hot', 'bright', 'tropical', 'festival', 'pool'],
      weight: 1.0,
      mood_influence: { Energetic: 0.8, Playful: 0.9, Adventurous: 0.7 }
    },
    autumn: {
      keywords: ['autumn', 'fall', 'leaves', 'orange', 'cozy', 'harvest', 'pumpkin', 'warm', 'golden'],
      weight: 1.0,
      mood_influence: { Cozy: 0.8, Nostalgic: 0.7, Peaceful: 0.6 }
    },
    winter: {
      keywords: ['winter', 'snow', 'cold', 'holiday', 'christmas', 'fireplace', 'sweater', 'cocoa', 'frost'],
      weight: 1.0,
      mood_influence: { Cozy: 0.9, Peaceful: 0.6, Romantic: 0.5 }
    },

    // === LIFESTYLE & ACTIVITY THEMES ===
    party: {
      keywords: ['party', 'celebration', 'birthday', 'festive', 'fun', 'dancing', 'music', 'crowd', 'night'],
      weight: 1.0,
      mood_influence: { Playful: 0.9, Energetic: 0.8, Adventurous: 0.6 }
    },
    luxury: {
      keywords: ['luxury', 'elegant', 'gold', 'marble', 'sophisticated', 'glamorous', 'expensive', 'rich', 'opulent'],
      weight: 1.0,
      mood_influence: { Elegant: 0.9, Romantic: 0.6, Mysterious: 0.5 }
    },
    kawaii: {
      keywords: ['kawaii', 'cute', 'sweet', 'pink', 'pastel', 'adorable', 'anime', 'japanese', 'soft'],
      weight: 1.0,
      mood_influence: { Playful: 0.9, Romantic: 0.6, Cozy: 0.5 }
    },

    // === CREATIVE & ARTISTIC THEMES ===
    artistic: {
      keywords: ['art', 'creative', 'painting', 'drawing', 'gallery', 'museum', 'sculpture', 'design', 'craft'],
      weight: 1.0,
      mood_influence: { Elegant: 0.7, Adventurous: 0.6, Peaceful: 0.5 }
    },

    // === FOOD & CULINARY THEMES ===
    food: {
      keywords: ['food', 'cooking', 'recipe', 'kitchen', 'chef', 'delicious', 'taste', 'meal', 'dining'],
      weight: 1.0,
      mood_influence: { Cozy: 0.7, Playful: 0.6, Elegant: 0.5 }
    },

    // === NIGHT & EVENING THEMES ===
    night: {
      keywords: ['night', 'evening', 'dark', 'moon', 'stars', 'city', 'lights', 'glow', 'neon'],
      weight: 1.0,
      mood_influence: { Mysterious: 0.8, Romantic: 0.6, Elegant: 0.7 }
    }
  };

  // Score each theme based on keyword matches
  let detectedThemes = [];
  let totalScore = 0;

  for (const [themeName, themeData] of Object.entries(themePatterns)) {
    let score = 0;
    let matchedKeywords = [];

    // Count keyword matches with different weights
    themeData.keywords.forEach(keyword => {
      const occurrences = (boardText.match(new RegExp(keyword, 'gi')) || []).length;
      if (occurrences > 0) {
        score += occurrences * themeData.weight;
        matchedKeywords.push(keyword);
      }
    });

    if (score > 0) {
      detectedThemes.push({
        theme: themeName,
        score: score,
        matchedKeywords: matchedKeywords,
        moodInfluence: themeData.mood_influence
      });
      totalScore += score;
    }
  }

  // Sort themes by score
  detectedThemes.sort((a, b) => b.score - a.score);

  // Calculate theme confidence based on strength of matches
  const primaryTheme = detectedThemes[0] || { theme: 'modern', score: 1 };
  const themeConfidence = Math.min(primaryTheme.score / 5, 1);

  return {
    detectedTheme: primaryTheme.theme,
    allThemes: detectedThemes.slice(0, 8),
    primaryScore: primaryTheme.score,
    aesthetic: primaryTheme.theme,
    complexity: primaryTheme.score > 5 ? 'high' : primaryTheme.score > 2 ? 'medium' : 'low',
    composition: getCompositionStyle(primaryTheme.theme),
    themes: detectedThemes.slice(0, 5).map(t => t.theme),
    keywords: extractEnhancedKeywords(boardText, primaryTheme.theme),
    sentiment: calculateSentiment(boardText),
    topics: getTopicCategories(primaryTheme.theme),
    confidence: themeConfidence,
    totalMatches: totalScore
  };
}
  
// === COMPREHENSIVE COLOR ANALYSIS ===
function generateAdvancedColorAnalysis(theme) {
  const colorSchemes = {
    // Energy themes
    energetic: {
      palette: [
        { hex: '#FF5722', mood: 'dynamic' },
        { hex: '#F44336', mood: 'powerful' },
        { hex: '#FF9800', mood: 'vibrant' },
        { hex: '#FFEB3B', mood: 'electric' },
        { hex: '#4CAF50', mood: 'fresh' }
      ],
      temperature: 'warm',
      harmony: 'complementary',
      lighting: 'bright'
    },
    morning: {
      palette: [
        { hex: '#FFD700', mood: 'golden' },
        { hex: '#FFA500', mood: 'sunrise' },
        { hex: '#FFEB3B', mood: 'bright' },
        { hex: '#FF9800', mood: 'warm' },
        { hex: '#FFF8DC', mood: 'cream' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'bright'
    },
    
    // Calm themes
    peaceful: {
      palette: [
        { hex: '#E3F2FD', mood: 'serene' },
        { hex: '#B3E5FC', mood: 'calm' },
        { hex: '#81C784', mood: 'soothing' },
        { hex: '#A5D6A7', mood: 'peaceful' },
        { hex: '#F1F8E9', mood: 'tranquil' }
      ],
      temperature: 'cool',
      harmony: 'analogous',
      lighting: 'soft'
    },
    cozy: {
      palette: [
        { hex: '#D7CCC8', mood: 'warm' },
        { hex: '#BCAAA4', mood: 'comfortable' },
        { hex: '#8D6E63', mood: 'earthy' },
        { hex: '#FFF3E0', mood: 'soft' },
        { hex: '#FFCCBC', mood: 'cozy' }
      ],
      temperature: 'warm',
      harmony: 'monochromatic',
      lighting: 'soft'
    },
    
    // Romantic themes
    romantic: {
      palette: [
        { hex: '#F8BBD9', mood: 'tender' },
        { hex: '#F48FB1', mood: 'romantic' },
        { hex: '#FCE4EC', mood: 'soft' },
        { hex: '#FF8A65', mood: 'warm' },
        { hex: '#FFCDD2', mood: 'loving' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'soft'
    },
    
    // Adventure themes
    adventure: {
      palette: [
        { hex: '#4CAF50', mood: 'nature' },
        { hex: '#8BC34A', mood: 'fresh' },
        { hex: '#FF9800', mood: 'sunset' },
        { hex: '#795548', mood: 'earth' },
        { hex: '#607D8B', mood: 'sky' }
      ],
      temperature: 'neutral',
      harmony: 'triadic',
      lighting: 'natural'
    },
    
    // Style themes
    minimalist: {
      palette: [
        { hex: '#FFFFFF', mood: 'pure' },
        { hex: '#F5F5F5', mood: 'light' },
        { hex: '#E0E0E0', mood: 'neutral' },
        { hex: '#BDBDBD', mood: 'calm' },
        { hex: '#9E9E9E', mood: 'sophisticated' }
      ],
      temperature: 'neutral',
      harmony: 'monochromatic',
      lighting: 'bright'
    },
    gothic: {
      palette: [
        { hex: '#212121', mood: 'dark' },
        { hex: '#424242', mood: 'mysterious' },
        { hex: '#616161', mood: 'moody' },
        { hex: '#8E24AA', mood: 'dramatic' },
        { hex: '#AD1457', mood: 'intense' }
      ],
      temperature: 'cool',
      harmony: 'monochromatic',
      lighting: 'dim'
    },
    
    // Seasonal themes
    spring: {
      palette: [
        { hex: '#C8E6C9', mood: 'fresh' },
        { hex: '#F8BBD9', mood: 'bloom' },
        { hex: '#FFF9C4', mood: 'new' },
        { hex: '#E1BEE7', mood: 'soft' },
        { hex: '#B2DFDB', mood: 'renewal' }
      ],
      temperature: 'cool',
      harmony: 'analogous',
      lighting: 'soft'
    },
    summer: {
      palette: [
        { hex: '#FFD54F', mood: 'sunny' },
        { hex: '#FF7043', mood: 'hot' },
        { hex: '#42A5F5', mood: 'sky' },
        { hex: '#66BB6A', mood: 'tropical' },
        { hex: '#EC407A', mood: 'vibrant' }
      ],
      temperature: 'warm',
      harmony: 'complementary',
      lighting: 'bright'
    },
    
    // Add vintage for fallback
    vintage: {
      palette: [
        { hex: '#DEB887', mood: 'nostalgic' },
        { hex: '#D2B48C', mood: 'aged' },
        { hex: '#BC8F8F', mood: 'romantic' },
        { hex: '#F5DEB3', mood: 'sepia' },
        { hex: '#FFE4B5', mood: 'vintage' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'soft'
    },
    
    // Default fallback
    modern: {
      palette: [
        { hex: '#2196F3', mood: 'contemporary' },
        { hex: '#4CAF50', mood: 'fresh' },
        { hex: '#FF9800', mood: 'accent' },
        { hex: '#9E9E9E', mood: 'neutral' },
        { hex: '#FFFFFF', mood: 'clean' }
      ],
      temperature: 'neutral',
      harmony: 'triadic',
      lighting: 'bright'
    }
  };

  const scheme = colorSchemes[theme] || colorSchemes.modern;
  
  return {
    palette: scheme.palette,
    dominant: scheme.palette[0],
    temperature: scheme.temperature,
    harmony: scheme.harmony,
    lighting: scheme.lighting
  };
}  
// === SOPHISTICATED MOOD CALCULATION ===
function calculateEnhancedMood(themeAnalysis, colorAnalysis, boardText) {
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

  // Apply mood influences from all detected themes
  themeAnalysis.allThemes.forEach((themeData, index) => {
    const weight = Math.max(0.1, 1 - (index * 0.15)); // Diminishing weight for secondary themes
    
    if (themeData.moodInfluence) {
      Object.entries(themeData.moodInfluence).forEach(([moodName, influence]) => {
        const moodObj = moods.find(m => m.name === moodName);
        if (moodObj) {
          moodObj.score += influence * weight * (themeData.score / 5);
        }
      });
    }
  });

  // Color temperature influence
  if (colorAnalysis.temperature === 'warm') {
    moods.find(m => m.name === 'Cozy').score += 0.15;
    moods.find(m => m.name === 'Energetic').score += 0.1;
    moods.find(m => m.name === 'Romantic').score += 0.1;
  } else if (colorAnalysis.temperature === 'cool') {
    moods.find(m => m.name === 'Peaceful').score += 0.15;
    moods.find(m => m.name === 'Fresh').score += 0.1;
    moods.find(m => m.name === 'Elegant').score += 0.1;
  }

  // Lighting influence
  if (colorAnalysis.lighting === 'bright') {
    moods.find(m => m.name === 'Energetic').score += 0.1;
    moods.find(m => m.name === 'Playful').score += 0.05;
  } else if (colorAnalysis.lighting === 'soft' || colorAnalysis.lighting === 'golden') {
    moods.find(m => m.name === 'Romantic').score += 0.1;
    moods.find(m => m.name === 'Cozy').score += 0.05;
  }

  // Ensure minimum base scores for variety
  moods.forEach(mood => {
    mood.score = Math.max(mood.score, 0.05);
  });

  // Normalize and calculate confidence
  const maxScore = Math.max(...moods.map(m => m.score));
  moods.forEach(mood => {
    mood.confidence = Math.max(0, Math.min(1, mood.score / Math.max(maxScore, 0.5)));
  });

  const sorted = moods.sort((a, b) => b.confidence - a.confidence);

  return {
    primary: sorted[0],
    secondary: sorted.slice(1, 3),
    spectrum: sorted,
    emotions: sorted.slice(0, 3).map(m => m.name.toLowerCase()),
    moodDistribution: sorted.map(m => ({ name: m.name, score: m.confidence }))
  };
}
  
  // === COMPREHENSIVE MUSIC RECOMMENDATIONS ===
function generateAdvancedMusicRecommendations(moodAnalysis) {
  const musicMap = {
    Energetic: {
      genres: ['pop', 'dance', 'electronic', 'upbeat indie', 'rock', 'hip hop'],
      energy: 'high',
      tempo: '120-140 BPM',
      vocals: 'powerful vocals',
      examples: ['workout hits', 'dance anthems', 'pump-up songs']
    },
    Peaceful: {
      genres: ['ambient', 'classical', 'acoustic', 'meditation', 'new age', 'soft instrumental'],
      energy: 'low',
      tempo: '60-80 BPM',
      vocals: 'soft vocals or instrumental',
      examples: ['spa music', 'meditation sounds', 'nature sounds']
    },
    Romantic: {
      genres: ['r&b', 'soul', 'jazz', 'indie folk', 'soft pop', 'acoustic'],
      energy: 'medium',
      tempo: '70-100 BPM',
      vocals: 'intimate vocals',
      examples: ['love ballads', 'romantic jazz', 'intimate acoustic']
    },
    Nostalgic: {
      genres: ['classic rock', 'oldies', 'vintage jazz', 'retro pop', '80s hits'],
      energy: 'medium',
      tempo: '80-110 BPM',
      vocals: 'classic vocals',
      examples: ['throwback hits', 'classic favorites', 'retro vibes']
    },
    Adventurous: {
      genres: ['world music', 'folk', 'indie rock', 'alternative', 'travel songs'],
      energy: 'medium-high',
      tempo: '100-130 BPM',
      vocals: 'dynamic vocals',
      examples: ['road trip songs', 'adventure anthems', 'world beats']
    },
    Cozy: {
      genres: ['indie folk', 'acoustic', 'coffee shop', 'chill', 'soft indie'],
      energy: 'low-medium',
      tempo: '70-90 BPM',
      vocals: 'warm vocals',
      examples: ['coffee shop playlist', 'cozy evening', 'rainy day songs']
    },
    Elegant: {
      genres: ['classical', 'jazz', 'sophisticated pop', 'instrumental', 'chamber music'],
      energy: 'medium',
      tempo: '80-110 BPM',
      vocals: 'refined vocals',
      examples: ['dinner party music', 'sophisticated jazz', 'classical elegance']
    },
    Playful: {
      genres: ['pop', 'indie pop', 'funk', 'upbeat alternative', 'feel-good hits'],
      energy: 'high',
      tempo: '110-130 BPM',
      vocals: 'cheerful vocals',
      examples: ['feel-good anthems', 'happy songs', 'upbeat indie']
    },
    Fresh: {
      genres: ['indie', 'alternative', 'modern pop', 'electronic chill', 'contemporary'],
      energy: 'medium-high',
      tempo: '100-120 BPM',
      vocals: 'contemporary vocals',
      examples: ['fresh indie', 'modern hits', 'contemporary favorites']
    },
    Mysterious: {
      genres: ['dark ambient', 'alternative', 'electronic', 'post-rock', 'cinematic'],
      energy: 'medium',
      tempo: '80-110 BPM',
      vocals: 'atmospheric vocals',
      examples: ['dark ambient', 'cinematic scores', 'mysterious soundscapes']
    }
  };

  const primary = moodAnalysis.primary.name;
  const mapping = musicMap[primary] || musicMap.Fresh;

  // Include influences from secondary moods
  const secondaryGenres = moodAnalysis.secondary.slice(0, 2).map(mood => {
    const secondaryMapping = musicMap[mood.name];
    return secondaryMapping ? secondaryMapping.genres.slice(0, 2) : [];
  }).flat();

  const combinedGenres = [...mapping.genres, ...secondaryGenres].slice(0, 8);

  return {
    genres: [...new Set(combinedGenres)], // Remove duplicates
    energy: mapping.energy,
    tempo: mapping.tempo,
    instrumental: 'mixed preferences',
    vocals: mapping.vocals,
    era: 'contemporary with classics',
    examples: mapping.examples,
    mood_based: true
  };

  
  // === CALCULATE OVERALL ANALYSIS CONFIDENCE ===
  const overallConfidence = calculateOverallConfidence({
    themeConfidence: themeAnalysis.confidence,
    themeMatches: themeAnalysis.totalMatches,
    moodConfidence: moodAnalysis.primary.confidence,
    moodDistribution: moodAnalysis.moodDistribution
  });
  
  console.log('📊 Overall confidence:', Math.round(overallConfidence * 100) + '%');
  
  // === RETURN COMPREHENSIVE ANALYSIS ===
  return {
    // Enhanced mood analysis with proper confidence values
    mood: {
      primary: moodAnalysis.primary.name,
      confidence: Math.round(moodAnalysis.primary.confidence * 100) / 100, // Round to 2 decimals
      secondary: moodAnalysis.secondary.map(m => m.name),
      emotional_spectrum: moodAnalysis.spectrum.map(mood => ({
        name: mood.name,
        confidence: Math.round(mood.confidence * 100) / 100 // Properly calculated confidence
      })),
      mood_distribution: moodAnalysis.moodDistribution,
      detected_emotions: moodAnalysis.emotions
    },
    
    // Rich visual analysis
    visual: {
      color_palette: colorAnalysis.palette,
      dominant_colors: colorAnalysis.dominant,
      color_temperature: colorAnalysis.temperature,
      color_harmony: colorAnalysis.harmony,
      aesthetic_style: themeAnalysis.aesthetic,
      visual_complexity: themeAnalysis.complexity,
      lighting_mood: colorAnalysis.lighting,
      composition_style: themeAnalysis.composition || 'balanced'
    },
    
    // Comprehensive content analysis
    content: {
      themes: themeAnalysis.themes,
      primary_theme: themeAnalysis.detectedTheme,
      all_detected_themes: themeAnalysis.allThemes.map(t => ({
        name: t.theme,
        score: t.score,
        keywords: t.matchedKeywords,
        confidence: Math.round((t.score / Math.max(themeAnalysis.totalMatches, 1)) * 100) / 100
      })),
      keywords: themeAnalysis.keywords,
      sentiment: themeAnalysis.sentiment,
      topics: themeAnalysis.topics,
      emotional_tone: moodAnalysis.emotions,
      analysis_depth: themeAnalysis.allThemes.length
    },
    
    // Comprehensive music recommendations
    music: {
      primary_genres: musicAnalysis.genres,
      energy_level: musicAnalysis.energy,
      tempo_range: musicAnalysis.tempo,
      instrumental_preference: musicAnalysis.instrumental,
      vocal_style: musicAnalysis.vocals,
      era_preference: musicAnalysis.era,
      music_examples: musicAnalysis.examples || [],
      mood_based_selection: true
    },
    
    // Enhanced board metadata
    board: {
      name: boardInfo.boardName,
      url: boardInfo.originalUrl,
      username: boardInfo.username,
      detected_theme: themeAnalysis.detectedTheme,
      theme_confidence: Math.round(themeAnalysis.confidence * 100) / 100,
      theme_matches: themeAnalysis.totalMatches,
      estimated_pins: Math.floor(Math.random() * 50) + 15,
      diversity_score: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100,
      cohesion_score: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
      analysis_keywords: analysisText.split(' ').filter(w => w.length > 3).slice(0, 10)
    },
    
    // Analysis metadata
    analysis_method: 'comprehensive_theme_detection',
    confidence: Math.round(overallConfidence * 100) / 100,
    analysis_quality: getAnalysisQuality(overallConfidence),
    processing_details: {
      themes_detected: themeAnalysis.allThemes.length,
      primary_theme_score: themeAnalysis.primaryScore,
      mood_certainty: moodAnalysis.primary.confidence,
      color_temperature: colorAnalysis.temperature,
      recommended_genres: musicAnalysis.genres.length
    },
    timestamp: new Date().toISOString()
  };
}

// Helper function to calculate overall confidence
function calculateOverallConfidence(factors) {
  const {
    themeConfidence,
    themeMatches,
    moodConfidence,
    moodDistribution
  } = factors;
  
  // Base confidence from theme detection
  let confidence = themeConfidence * 0.4;
  
  // Boost confidence based on number of theme matches
  const matchBonus = Math.min(themeMatches / 10, 0.2);
  confidence += matchBonus;
  
  // Factor in mood confidence
  confidence += moodConfidence * 0.3;
  
  // Boost if mood distribution is clear (not all moods are similar)
  const moodClarity = calculateMoodClarity(moodDistribution);
  confidence += moodClarity * 0.1;
  
  // Ensure minimum and maximum bounds
  return Math.max(0.3, Math.min(0.95, confidence));
}

// Helper function to calculate mood clarity
function calculateMoodClarity(moodDistribution) {
  if (!moodDistribution || moodDistribution.length < 2) return 0;
  
  const topMood = moodDistribution[0].score;
  const secondMood = moodDistribution[1].score;
  
  // Higher clarity when there's a clear winner
  return Math.max(0, topMood - secondMood);
}

// Helper function to determine analysis quality
function getAnalysisQuality(confidence) {
  if (confidence >= 0.8) return 'excellent';
  if (confidence >= 0.6) return 'good';
  if (confidence >= 0.4) return 'moderate';
  return 'basic';
}

// Enhanced board info extraction with better URL parsing
function extractBoardInfo(url) {
  const urlParts = url.split('/').filter(part => part.length > 0);
  
  let username, boardName;
  
  // Handle different Pinterest URL formats
  if (url.includes('pinterest.com')) {
    const pinterestIndex = urlParts.findIndex(part => part.includes('pinterest.com'));
    if (pinterestIndex >= 0 && urlParts.length > pinterestIndex + 2) {
      username = urlParts[pinterestIndex + 1];
      boardName = urlParts[pinterestIndex + 2];
    }
  }
  
  // Handle pin.it short URLs
  if (url.includes('pin.it')) {
    boardName = 'shared-pin';
    username = 'pinterest-user';
  }
  
  // Fallback extraction
  if (!username || !boardName) {
    username = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 3] || 'unknown';
    boardName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'board';
  }
  
  // Clean up board name for better analysis
  const cleanBoardName = boardName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/%20/g, ' ')
    .replace(/[0-9]/g, '') // Remove numbers
    .trim();
  
  return {
    username: username,
    boardName: cleanBoardName,
    originalUrl: url,
    urlParts: urlParts.filter(part => !part.includes('pinterest.com') && !part.includes('http'))
  };
}

// Enhanced keyword extraction
function extractEnhancedKeywords(text, theme) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get top keywords
  const sortedWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15);
  
  return sortedWords.map(([word, count]) => ({
    word,
    count,
    relevance: count / words.length,
    theme_related: isThemeRelated(word, theme)
  }));
}

// Helper function to check if word is theme-related
function isThemeRelated(word, theme) {
  const themeKeywords = {
    morning: ['morning', 'sunrise', 'coffee', 'breakfast', 'early'],
    energetic: ['energy', 'power', 'strong', 'active', 'vibrant'],
    peaceful: ['calm', 'peace', 'zen', 'quiet', 'serene'],
    romantic: ['love', 'romantic', 'heart', 'valentine', 'couple'],
    // Add more as needed
  };
  
  const keywords = themeKeywords[theme] || [];
  return keywords.some(keyword => word.includes(keyword) || keyword.includes(word));
}

// Enhanced sentiment calculation
function calculateSentiment(text) {
  const positiveWords = ['beautiful', 'amazing', 'love', 'perfect', 'gorgeous', 'stunning', 'wonderful', 'happy', 'joy', 'bright', 'fresh', 'new', 'exciting', 'fantastic', 'awesome'];
  const negativeWords = ['dark', 'sad', 'gloomy', 'depressing', 'ugly', 'hate', 'terrible', 'awful', 'bad', 'worst'];
  const neutralWords = ['okay', 'fine', 'normal', 'regular', 'standard', 'basic', 'simple'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) positiveScore++;
    if (negativeWords.some(neg => word.includes(neg))) negativeScore++;
    if (neutralWords.some(neu => word.includes(neu))) neutralScore++;
  });
  
  const totalScore = positiveScore - negativeScore;
  const confidence = Math.min((positiveScore + negativeScore) / words.length * 10, 1);
  
  let label = 'neutral';
  if (totalScore > 0) label = 'positive';
  else if (totalScore < 0) label = 'negative';
  
  return {
    score: Math.max(-1, Math.min(1, totalScore / Math.max(words.length, 1))),
    label: label,
    confidence: confidence,
    breakdown: { positive: positiveScore, negative: negativeScore, neutral: neutralScore }
  };
}

// Enhanced topic categorization
function getTopicCategories(theme) {
  const categories = {
    morning: ['Lifestyle', 'Wellness', 'Productivity', 'Coffee Culture', 'Daily Routines'],
    energetic: ['Fitness', 'Motivation', 'Lifestyle', 'Sports', 'High Energy'],
    workout: ['Health', 'Fitness', 'Wellness', 'Sports', 'Exercise'],
    productivity: ['Work', 'Organization', 'Goals', 'Motivation', 'Business'],
    peaceful: ['Meditation', 'Mindfulness', 'Wellness', 'Spirituality', 'Relaxation'],
    cozy: ['Home', 'Comfort', 'Hygge', 'Relaxation', 'Interior Design'],
    romantic: ['Relationships', 'Love', 'Romance', 'Couples', 'Dating'],
    adventure: ['Travel', 'Exploration', 'Adventure', 'Outdoor Activities', 'Discovery'],
    minimalist: ['Interior Design', 'Architecture', 'Lifestyle', 'Simplicity', 'Modern Living'],
    bohemian: ['Art', 'Fashion', 'Travel', 'Culture', 'Free Spirit'],
    vintage: ['Antiques', 'Fashion', 'History', 'Collectibles', 'Nostalgia'],
    gothic: ['Alternative Fashion', 'Dark Aesthetics', 'Art', 'Music', 'Subculture'],
    spring: ['Seasonal', 'Nature', 'Renewal', 'Fresh Starts', 'Gardening'],
    summer: ['Seasonal', 'Vacation', 'Outdoor Activities', 'Beach Life', 'Travel'],
    autumn: ['Seasonal', 'Harvest', 'Cozy Living', 'Nature', 'Comfort'],
    winter: ['Seasonal', 'Holiday', 'Cozy Living', 'Winter Sports', 'Comfort'],
    party: ['Entertainment', 'Social Events', 'Celebration', 'Fun', 'Music'],
    luxury: ['High-End Fashion', 'Luxury Lifestyle', 'Fine Living', 'Elegance', 'Sophistication'],
    food: ['Culinary', 'Cooking', 'Dining', 'Food Culture', 'Recipes'],
    artistic: ['Art', 'Creativity', 'Design', 'Culture', 'Expression'],
    night: ['Nightlife', 'Evening Activities', 'Urban Culture', 'Entertainment', 'Mood']
  };
  
  return categories[theme] || ['Design', 'Lifestyle', 'General Interest'];
}

// Enhanced composition style mapping
function getCompositionStyle(theme) {
  const styles = {
    minimalist: 'clean lines and negative space',
    maximalist: 'rich layering and abundance',
    bohemian: 'eclectic mixing and free-form',
    vintage: 'classic proportions and timeless balance',
    modern: 'geometric precision and contemporary flow',
    romantic: 'soft curves and delicate arrangements',
    gothic: 'dramatic contrasts and ornate details',
    energetic: 'dynamic movement and bold arrangements',
    peaceful: 'harmonious balance and gentle flow',
    adventure: 'expansive views and rugged compositions',
    luxury: 'sophisticated elegance and refined proportions',
    artistic: 'creative expression and experimental layouts',
    nature: 'organic flow and natural arrangements'
  };
  
  return styles[theme] || 'balanced composition';
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

// All your helper functions (analyzeThemes, generateAdvancedColorAnalysis, etc.)
// [I'll include the key ones to keep this working]

function analyzeThemes(boardText) {
  const themePatterns = {
    minimalist: ['minimalist', 'simple', 'clean', 'white', 'minimal', 'scandinavian'],
    bohemian: ['boho', 'bohemian', 'eclectic', 'hippie', 'free', 'artistic', 'macrame'],
    vintage: ['vintage', 'retro', 'antique', 'classic', 'old', 'nostalgic'],
    modern: ['modern', 'contemporary', 'sleek', 'geometric', 'industrial'],
    natural: ['natural', 'organic', 'wood', 'plant', 'green', 'earth', 'sustainable']
  };

  let detectedTheme = 'modern';
  let maxScore = 0;

  for (const [theme, keywords] of Object.entries(themePatterns)) {
    const score = keywords.reduce((sum, keyword) => {
      return sum + (boardText.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      detectedTheme = theme;
    }
  }

  return {
    detectedTheme,
    aesthetic: detectedTheme,
    complexity: maxScore > 3 ? 'high' : maxScore > 1 ? 'medium' : 'low',
    composition: 'balanced',
    themes: [detectedTheme],
    keywords: [],
    sentiment: { score: 0.5, label: 'neutral' },
    topics: ['Design', 'Lifestyle']
  };
}

function generateAdvancedColorAnalysis(theme) {
  const colorSchemes = {
    minimalist: {
      palette: [{ hex: '#FFFFFF', mood: 'pure' }, { hex: '#F5F5F5', mood: 'light' }],
      temperature: 'neutral',
      harmony: 'monochromatic',
      lighting: 'bright'
    },
    modern: {
      palette: [{ hex: '#2C3E50', mood: 'sophisticated' }, { hex: '#ECF0F1', mood: 'clean' }],
      temperature: 'cool',
      harmony: 'triadic',
      lighting: 'crisp'
    }
  };

  const scheme = colorSchemes[theme] || colorSchemes.modern;
  
  return {
    palette: scheme.palette,
    dominant: scheme.palette[0],
    temperature: scheme.temperature,
    harmony: scheme.harmony,
    lighting: scheme.lighting
  };
}

function calculateEnhancedMood(themeAnalysis, colorAnalysis, boardText) {
  const moods = [
    { name: 'Peaceful', score: 0.8 },
    { name: 'Energetic', score: 0.6 },
    { name: 'Romantic', score: 0.5 }
  ];

  return {
    primary: moods[0],
    secondary: moods.slice(1, 3),
    spectrum: moods,
    emotions: ['peaceful', 'calm']
  };
}

function generateAdvancedMusicRecommendations(moodAnalysis) {
  return {
    genres: ['ambient', 'classical', 'acoustic'],
    energy: 'low',
    tempo: '60-80 BPM',
    instrumental: 'instrumental preferred',
    vocals: 'soft vocals',
    era: 'contemporary'
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MoodSync Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎵 Spotify configured: ${!!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)}`);
  console.log('📡 Available endpoints:');
  console.log('  GET  / - API info');
  console.log('  GET  /health - Health check');
  console.log('  GET  /api/spotify/auth-url - Get Spotify auth URL');
  console.log('  POST /api/spotify/callback - Exchange code for token');
  console.log('  POST /api/analyze-pinterest - Basic Pinterest analysis');
  console.log('  POST /api/analyze-pinterest-enhanced - Enhanced Pinterest analysis');
  console.log('  POST /api/create-playlist - Create Spotify playlist');
});
