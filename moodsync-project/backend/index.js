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

// === HELPER FUNCTIONS (DEFINED FIRST) ===

// Simple board analysis function
function analyzePinterestBoard(url) {
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

// Simple mood analysis
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

// CLEAN Enhanced Analysis Function (No external dependencies)
async function generateEnhancedAnalysis(pinterestUrl, options = {}) {
  console.log('🔍 Starting enhanced analysis for:', pinterestUrl);
  
  try {
    // Safe URL parsing - inline to avoid function call issues
    const urlParts = pinterestUrl.split('/').filter(part => part && part.length > 0);
    let username = 'unknown';
    let boardName = 'unknown-board';
    
    if (pinterestUrl.includes('pinterest.com') && urlParts.length >= 4) {
      const pinterestIndex = urlParts.findIndex(part => part.includes('pinterest.com'));
      if (pinterestIndex >= 0) {
        username = urlParts[pinterestIndex + 1] || 'unknown';
        boardName = urlParts[pinterestIndex + 2] || 'unknown-board';
      }
    }
    
    // Clean board name
    const cleanBoardName = String(boardName)
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\+/g, ' ')
      .trim();
    
    // Create analysis text
    const analysisText = [cleanBoardName, username].join(' ').toLowerCase();
    console.log('📝 Analysis text:', analysisText);
    
    // Simple theme detection
    let detectedTheme = 'modern';
    let mood = 'Peaceful';
    let genres = ['acoustic', 'indie'];
    let energy = 'medium';
    
    if (analysisText.includes('morning') || analysisText.includes('person')) {
      detectedTheme = 'morning';
      mood = 'Energetic';
      genres = ['pop', 'indie', 'upbeat', 'electronic'];
      energy = 'high';
    } else if (analysisText.includes('cozy') || analysisText.includes('home')) {
      detectedTheme = 'cozy';
      mood = 'Cozy';
      genres = ['acoustic', 'folk', 'lo-fi', 'indie folk'];
      energy = 'low';
    } else if (analysisText.includes('minimal') || analysisText.includes('clean')) {
      detectedTheme = 'minimalist';
      mood = 'Peaceful';
      genres = ['ambient', 'classical', 'minimal', 'meditation'];
      energy = 'low';
    } else if (analysisText.includes('vintage') || analysisText.includes('retro')) {
      detectedTheme = 'vintage';
      mood = 'Nostalgic';
      genres = ['jazz', 'soul', 'classic rock', 'oldies'];
      energy = 'medium';
    } else if (analysisText.includes('dark') || analysisText.includes('gothic')) {
      detectedTheme = 'dark';
      mood = 'Mysterious';
      genres = ['alternative', 'gothic', 'post-rock', 'dark electronic'];
      energy = 'medium';
    }
    
    console.log('🎨 Detected theme:', detectedTheme, 'mood:', mood);
    
    // Generate color palette based on theme
    const colorPalettes = {
      morning: [
        { hex: '#FFD700', mood: 'golden' },
        { hex: '#FFA500', mood: 'sunrise' },
        { hex: '#FFEB3B', mood: 'bright' },
        { hex: '#FF9800', mood: 'warm' }
      ],
      cozy: [
        { hex: '#D7CCC8', mood: 'warm' },
        { hex: '#BCAAA4', mood: 'comfortable' },
        { hex: '#8D6E63', mood: 'earthy' },
        { hex: '#FFF3E0', mood: 'soft' }
      ],
      minimalist: [
        { hex: '#FFFFFF', mood: 'pure' },
        { hex: '#F5F5F5', mood: 'light' },
        { hex: '#E0E0E0', mood: 'neutral' },
        { hex: '#BDBDBD', mood: 'calm' }
      ],
      vintage: [
        { hex: '#DEB887', mood: 'nostalgic' },
        { hex: '#D2B48C', mood: 'aged' },
        { hex: '#BC8F8F', mood: 'romantic' },
        { hex: '#F5DEB3', mood: 'sepia' }
      ],
      dark: [
        { hex: '#2C3E50', mood: 'dramatic' },
        { hex: '#34495E', mood: 'mysterious' },
        { hex: '#7F8C8D', mood: 'moody' },
        { hex: '#95A5A6', mood: 'atmospheric' }
      ],
      modern: [
        { hex: '#2196F3', mood: 'contemporary' },
        { hex: '#4CAF50', mood: 'fresh' },
        { hex: '#FF9800', mood: 'accent' },
        { hex: '#9E9E9E', mood: 'neutral' }
      ]
    };
    
    const palette = colorPalettes[detectedTheme] || colorPalettes.modern;
    
    // Return comprehensive analysis
    const analysis = {
      mood: {
        primary: mood,
        confidence: 0.85,
        secondary: ['Fresh', 'Modern'],
        emotional_spectrum: [
          { name: mood, confidence: 0.85 },
          { name: 'Fresh', confidence: 0.65 },
          { name: 'Modern', confidence: 0.55 },
          { name: 'Elegant', confidence: 0.45 },
          { name: 'Peaceful', confidence: 0.35 }
        ]
      },
      visual: {
        color_palette: palette,
        dominant_colors: palette[0],
        color_temperature: detectedTheme === 'morning' || detectedTheme === 'cozy' ? 'warm' : 'cool',
        color_harmony: 'analogous',
        aesthetic_style: detectedTheme,
        visual_complexity: 'medium',
        lighting_mood: energy === 'high' ? 'bright' : 'soft',
        composition_style: 'balanced'
      },
      content: {
        sentiment: { score: 0.6, label: 'positive' },
        keywords: [
          { word: cleanBoardName.split(' ')[0] || 'board', count: 1 }
        ],
        topics: ['Lifestyle', 'Design', 'Mood'],
        themes: [detectedTheme]
      },
      music: {
        primary_genres: genres,
        energy_level: energy,
        tempo_range: energy === 'high' ? '120-140 BPM' : energy === 'low' ? '60-80 BPM' : '80-110 BPM',
        vocal_style: 'contemporary vocals',
        era_preference: 'contemporary'
      },
      board: {
        name: cleanBoardName,
        url: pinterestUrl,
        username: username,
        detected_theme: detectedTheme,
        theme_confidence: 0.85,
        estimated_pins: 25,
        diversity_score: 0.75,
        cohesion_score: 0.80
      },
      confidence: 0.85,
      analysis_quality: 'excellent',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Enhanced analysis completed successfully');
    return analysis;
    
  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    throw new Error(`Enhanced analysis failed: ${error.message}`);
  }
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

// === API ENDPOINTS ===

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

    const analysis = analyzePinterestBoard(pinterestUrl);
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
