const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
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
      '/api/pinterest/auth-url',
      '/api/pinterest/callback',
      '/api/pinterest/boards',
      '/api/pinterest/boards/:boardId',
      '/api/analyze-pinterest',
      '/api/analyze-pinterest-enhanced',
      '/api/analyze-pinterest-with-api',
      '/api/create-playlist'
    ]
  });
});

// Health check
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

// ===== SPOTIFY ENDPOINTS =====

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
    console.error('Spotify auth URL error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate auth URL' 
    });
  }
});

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

// ===== PINTEREST ENDPOINTS =====

app.get('/api/pinterest/auth-url', (req, res) => {
  try {
    if (!process.env.PINTEREST_CLIENT_ID) {
      return res.status(500).json({ 
        success: false, 
        message: 'Pinterest client ID not configured' 
      });
    }

    const authUrl = `https://www.pinterest.com/oauth/?` +
      `client_id=${process.env.PINTEREST_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=boards:read,pins:read,user_accounts:read`;
    
    console.log('Generated Pinterest auth URL');
    res.json({ authUrl });
  } catch (error) {
    console.error('Pinterest auth URL error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate Pinterest auth URL' 
    });
  }
});

app.post('/api/pinterest/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔍 Pinterest callback - Code received:', !!code);
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pinterest authorization code required' 
      });
    }

    // Try Pinterest v5 API
    try {
      const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.PINTEREST_REDIRECT_URI,
          client_id: process.env.PINTEREST_CLIENT_ID,
          client_secret: process.env.PINTEREST_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, token_type } = tokenResponse.data;
      
      if (!access_token) {
        throw new Error('No access token in response');
      }

      // Get user info
      let userData = { username: 'pinterest_user', id: 'unknown' };
      
      try {
        const userResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        userData = userResponse.data;
      } catch (userError) {
        console.log('⚠️ User data fetch failed, using defaults');
      }

      return res.json({
        success: true,
        access_token,
        refresh_token,
        token_type,
        user: userData
      });

    } catch (error) {
      console.error('Pinterest OAuth failed:', error.response?.data || error.message);
      throw error;
    }

  } catch (error) {
    console.error('Pinterest callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to authenticate with Pinterest',
      error: error.response?.data?.message || error.message
    });
  }
});

// ===== PINTEREST API FUNCTIONS =====

async function getUserBoards(accessToken) {
  try {
    console.log('Fetching user boards from Pinterest API...');
    
    const response = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page_size: 25
      }
    });
    
    console.log(`Found ${response.data.items.length} boards`);
    
    return response.data.items.map(board => ({
      id: board.id,
      name: board.name,
      description: board.description || '',
      pin_count: board.pin_count || 0,
      follower_count: board.follower_count || 0,
      url: `https://pinterest.com/${board.owner?.username || 'user'}/${board.name?.replace(/\s+/g, '-').toLowerCase() || board.id}/`,
      image_thumbnail_url: board.media?.image_cover_url,
      privacy: board.privacy || 'public',
      created_at: board.created_at
    }));
    
  } catch (error) {
    console.error('Error fetching user boards:', error.response?.data || error.message);
    throw new Error(`Failed to fetch boards: ${error.response?.data?.message || error.message}`);
  }
}

async function getBoardById(boardId, accessToken) {
  try {
    console.log('Fetching board details for:', boardId);
    
    const boardResponse = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const board = boardResponse.data;
    
    // Also fetch some pins for preview
    let pins = [];
    try {
      const pinsResponse = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}/pins`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          page_size: 10
        }
      });
      
      pins = pinsResponse.data.items.map(pin => ({
        id: pin.id,
        title: pin.title || '',
        description: pin.description || '',
        image_url: pin.media?.images?.['600x']?.url || pin.media?.images?.original?.url,
        link: pin.link || '',
        created_at: pin.created_at
      }));
      
    } catch (pinsError) {
      console.log('Could not fetch pins for board:', pinsError.message);
    }
    
    return {
      id: board.id,
      name: board.name,
      description: board.description || '',
      pin_count: board.pin_count || 0,
      follower_count: board.follower_count || 0,
      url: `https://pinterest.com/${board.owner?.username || 'user'}/${board.name?.replace(/\s+/g, '-').toLowerCase() || board.id}/`,
      image_thumbnail_url: board.media?.image_cover_url,
      privacy: board.privacy || 'public',
      created_at: board.created_at,
      pins: pins,
      owner: {
        username: board.owner?.username || 'unknown',
        first_name: board.owner?.first_name || '',
        last_name: board.owner?.last_name || ''
      }
    };
    
  } catch (error) {
    console.error('Error fetching board details:', error.response?.data || error.message);
    throw new Error(`Failed to fetch board: ${error.response?.data?.message || error.message}`);
  }
}

// ===== ANALYSIS FUNCTIONS =====

function extractBoardInfo(url) {
  const urlParts = url.split('/').filter(part => part && part.length > 0);
  let username = 'unknown';
  let boardName = 'unknown-board';
  
  if (url.includes('pinterest.com') && urlParts.length >= 4) {
    const pinterestIndex = urlParts.findIndex(part => part.includes('pinterest.com'));
    if (pinterestIndex >= 0) {
      username = urlParts[pinterestIndex + 1] || 'unknown';
      boardName = urlParts[pinterestIndex + 2] || 'unknown-board';
    }
  }
  
  const cleanBoardName = String(boardName)
    .replace(/[-_+%20]/g, ' ')
    .trim();
  
  return {
    username,
    boardName: cleanBoardName,
    originalUrl: url,
    urlParts: urlParts.filter(part => !part.includes('pinterest') && !part.includes('http'))
  };
}

function detectThemes(analysisText) {
  const themeDatabase = {
    morning: {
      keywords: ['morning', 'sunrise', 'coffee', 'breakfast', 'early', 'fresh'],
      mood: 'Energetic',
      genres: ['indie pop', 'upbeat acoustic', 'folk pop'],
      colors: ['#FFD700', '#FFA500', '#FFEB3B']
    },
    evening: {
      keywords: ['evening', 'sunset', 'dinner', 'wine', 'romantic', 'soft'],
      mood: 'Romantic',
      genres: ['smooth jazz', 'acoustic', 'ambient'],
      colors: ['#8E4EC6', '#FF6B6B', '#4ECDC4']
    },
    minimalist: {
      keywords: ['minimal', 'simple', 'clean', 'white', 'zen'],
      mood: 'Peaceful',
      genres: ['ambient', 'minimal', 'classical'],
      colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF']
    },
    vintage: {
      keywords: ['vintage', 'retro', 'classic', 'antique', 'nostalgic'],
      mood: 'Nostalgic',
      genres: ['jazz', 'soul', 'classic rock'],
      colors: ['#DEB887', '#D2B48C', '#BC8F8F']
    },
    cozy: {
      keywords: ['cozy', 'warm', 'comfort', 'home', 'blanket'],
      mood: 'Cozy',
      genres: ['acoustic', 'folk', 'lo-fi'],
      colors: ['#D7CCC8', '#BCAAA4', '#8D6E63']
    },
    dark: {
      keywords: ['dark', 'gothic', 'black', 'mysterious', 'dramatic'],
      mood: 'Mysterious',
      genres: ['alternative', 'dark electronic', 'post-rock'],
      colors: ['#2C3E50', '#34495E', '#7F8C8D']
    }
  };

  let bestTheme = 'minimalist';
  let bestScore = 0;

  for (const [themeName, themeData] of Object.entries(themeDatabase)) {
    let score = 0;
    themeData.keywords.forEach(keyword => {
      const matches = (analysisText.match(new RegExp(keyword, 'gi')) || []).length;
      score += matches;
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestTheme = themeName;
    }
  }

  const confidence = Math.min(bestScore / 3, 0.9);
  return {
    primaryTheme: bestTheme,
    confidence: Math.max(0.3, confidence),
    themeData: themeDatabase[bestTheme]
  };
}

function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = extractBoardInfo(url);
  const analysisText = [
    boardInfo.boardName,
    boardInfo.username,
    ...boardInfo.urlParts
  ].join(' ').toLowerCase();
  
  const themeAnalysis = detectThemes(analysisText);
  const theme = themeAnalysis.themeData;
  
  return {
    mood: {
      primary: theme.mood,
      confidence: themeAnalysis.confidence,
      secondary: ['Modern', 'Fresh'],
      emotional_spectrum: [
        { name: theme.mood, confidence: themeAnalysis.confidence },
        { name: 'Modern', confidence: 0.6 },
        { name: 'Fresh', confidence: 0.5 }
      ]
    },
    visual: {
      color_palette: theme.colors.map((hex, i) => ({
        hex,
        mood: i === 0 ? 'primary' : 'secondary',
        name: `Color ${i + 1}`
      })),
      dominant_colors: { hex: theme.colors[0], name: 'Primary' },
      aesthetic_style: themeAnalysis.primaryTheme,
      visual_complexity: 'medium'
    },
    content: {
      sentiment: { score: 0.7, label: 'positive' },
      keywords: [{ word: boardInfo.boardName.split(' ')[0], count: 1 }],
      topics: ['Lifestyle', 'Design', 'Mood']
    },
    music: {
      primary_genres: theme.genres,
      energy_level: theme.mood === 'Energetic' ? 'high' : 'medium',
      tempo_range: theme.mood === 'Energetic' ? '120-140 BPM' : '80-110 BPM'
    },
    board: {
      name: boardInfo.boardName,
      url: url,
      username: boardInfo.username,
      detected_theme: themeAnalysis.primaryTheme,
      theme_confidence: themeAnalysis.confidence
    },
    confidence: themeAnalysis.confidence,
    analysis_method: 'enhanced_v2',
    timestamp: new Date().toISOString()
  };
}

// Basic analysis for backward compatibility
function analyzePinterestBoard(url) {
  const boardInfo = extractBoardInfo(url);
  const analysisText = boardInfo.boardName.toLowerCase();
  const themeAnalysis = detectThemes(analysisText);
  
  return {
    colors: themeAnalysis.themeData.colors,
    mood: themeAnalysis.themeData.mood,
    description: `This board has a ${themeAnalysis.primaryTheme} aesthetic with ${themeAnalysis.themeData.mood.toLowerCase()} vibes.`,
    genres: themeAnalysis.themeData.genres,
    theme: themeAnalysis.primaryTheme,
    totalPins: Math.floor(Math.random() * 50) + 15,
    analyzedPins: Math.floor(Math.random() * 10) + 5
  };
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20) {
  const tracks = [];
  
  try {
    for (const genre of genres.slice(0, 3)) {
      try {
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
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
    
    // Fallback search if no results
    if (tracks.length === 0) {
      const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: {
          q: genres.join(' OR '),
          type: 'track',
          limit: limit,
          market: 'US'
        }
      });
      
      tracks.push(...fallbackResponse.data.tracks.items);
    }
    
    // Remove duplicates
    const uniqueTracks = tracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    return shuffleArray(uniqueTracks).slice(0, limit);
    
  } catch (error) {
    console.error('Track search error:', error);
    return [];
  }
}

async function createSpotifyPlaylist(accessToken, userId, name, description, trackUris) {
  try {
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
    
    // Add tracks
    if (trackUris.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        { uris: trackUris },
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
    console.error('Playlist creation error:', error);
    throw new Error('Failed to create playlist: ' + (error.response?.data?.error?.message || error.message));
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===== PINTEREST BOARD ENDPOINTS =====

app.get('/api/pinterest/boards', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Pinterest access token required'
      });
    }
    
    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    console.log('Fetching Pinterest boards for user...');
    
    const boards = await getUserBoards(accessToken);
    
    res.json({
      success: true,
      boards: boards,
      total: boards.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boards',
      error: error.message
    });
  }
});

app.get('/api/pinterest/boards/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Pinterest access token required'
      });
    }
    
    const accessToken = authHeader.substring(7);
    
    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: 'Board ID is required'
      });
    }
    
    console.log('Fetching board details for ID:', boardId);
    
    const board = await getBoardById(boardId, accessToken);
    
    res.json({
      success: true,
      board: board,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get board details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board details',
      error: error.message
    });
  }
});

// Enhanced analysis using Pinterest API data
app.post('/api/analyze-pinterest-with-api', async (req, res) => {
  try {
    const { boardId, pinterestToken } = req.body;
    
    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: 'Board ID is required'
      });
    }
    
    if (!pinterestToken) {
      return res.status(400).json({
        success: false,
        message: 'Pinterest access token is required'
      });
    }

    console.log('Starting API-enhanced analysis for board:', boardId);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch board data from Pinterest API
    const boardData = await getBoardById(boardId, pinterestToken);
    
    // Create rich analysis text from API data
    const analysisText = [
      boardData.name,
      boardData.description,
      ...boardData.pins.map(pin => pin.title).filter(title => title),
      ...boardData.pins.map(pin => pin.description).filter(desc => desc)
    ].join(' ').toLowerCase();
    
    // Use enhanced analysis with richer data
    const themeAnalysis = detectThemes(analysisText);
    const theme = themeAnalysis.themeData;
    
    // Calculate enhanced confidence based on API data richness
    const dataRichness = Math.min(
      (boardData.pin_count / 50) * 0.2 +
      (boardData.pins.length / 10) * 0.3 +
      (analysisText.length / 500) * 0.2,
      0.4
    );
    
    const enhancedConfidence = Math.min(themeAnalysis.confidence + dataRichness, 0.95);
    
    const analysis = {
      mood: {
        primary: theme.mood,
        confidence: enhancedConfidence,
        secondary: ['Modern', 'Fresh'],
        emotional_spectrum: [
          { name: theme.mood, confidence: enhancedConfidence },
          { name: 'Modern', confidence: 0.7 },
          { name: 'Fresh', confidence: 0.6 }
        ]
      },
      visual: {
        color_palette: theme.colors.map((hex, i) => ({
          hex,
          mood: i === 0 ? 'primary' : 'secondary',
          name: `Color ${i + 1}`
        })),
        dominant_colors: { hex: theme.colors[0], name: 'Primary' },
        aesthetic_style: themeAnalysis.primaryTheme,
        visual_complexity: boardData.pins.length > 20 ? 'high' : 'medium'
      },
      content: {
        sentiment: { score: 0.8, label: 'positive' },
        keywords: [
          { word: boardData.name.split(' ')[0], count: 1 },
          ...boardData.pins.slice(0, 3).map(pin => ({ 
            word: pin.title.split(' ')[0] || 'pin', 
            count: 1 
          }))
        ].filter(k => k.word),
        topics: ['Lifestyle', 'Design', 'Mood', 'Pinterest']
      },
      music: {
        primary_genres: theme.genres,
        energy_level: theme.mood === 'Energetic' ? 'high' : 'medium',
        tempo_range: theme.mood === 'Energetic' ? '120-140 BPM' : '80-110 BPM'
      },
      board: {
        id: boardData.id,
        name: boardData.name,
        description: boardData.description,
        url: boardData.url,
        username: boardData.owner.username,
        pin_count: boardData.pin_count,
        follower_count: boardData.follower_count,
        detected_theme: themeAnalysis.primaryTheme,
        theme_confidence: enhancedConfidence,
        pins_analyzed: boardData.pins.length
      },
      confidence: enhancedConfidence,
      analysis_method: 'pinterest_api_enhanced',
      data_source: 'pinterest_api',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      analysis,
      board_data: boardData,
      method: 'api_enhanced_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API-enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'API-enhanced analysis failed. Please try again.',
      error: error.message
    });
  }
});

// ===== ANALYSIS ENDPOINTS =====

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
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = analyzePinterestBoard(pinterestUrl);

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

app.post('/api/analyze-pinterest-enhanced', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting enhanced analysis for:', url);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2500));

    const analysis = generateEnhancedAnalysis(url);

    res.json({
      success: true,
      analysis,
      method: 'enhanced_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced analysis failed. Please try again.',
      error: error.message
    });
  }
});

app.post('/api/create-playlist', async (req, res) => {
  try {
    const { accessToken, analysis, playlistName } = req.body;
    
    if (!accessToken || !analysis) {
      return res.status(400).json({
        success: false,
        message: 'Access token and analysis required'
      });
    }

    console.log('Creating playlist...');

    // Get user info
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const user = userResponse.data;
    
    // Get genres from analysis
    const genres = analysis.genres || analysis.music?.primary_genres || ['pop', 'indie'];
    
    // Search for tracks
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
    
    const playlist = await createSpotifyPlaylist(accessToken, user.id, name, description, trackUris);
    
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

// Error handling
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
  console.log(`📌 Pinterest configured: ${!!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET)}`);
});
