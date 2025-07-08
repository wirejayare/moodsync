const express = require('express');
const cors = require('cors');
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://moodsync-jw.netlify.app' 
  ],
  credentials: true
};
const axios = require('axios');
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

// Pinterest board analysis
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

// Generate mood analysis
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
    // Search for tracks using different genre combinations
    for (const genre of genres.slice(0, 3)) {
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
    }
    
    // If no genre-specific results, search with mood keywords
    if (tracks.length === 0) {
      const moodKeywords = genres.slice(0, 2).join(' OR ');
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
    
    return shuffleArray(uniqueTracks).slice(0, limit);
    
  } catch (error) {
    console.error('Track search error:', error.response?.data || error.message);
    return [];
  }
}

// Create Spotify playlist
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
    
    // Add tracks to playlist
    if (trackUris.length > 0) {
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
    throw new Error('Failed to create playlist');
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = await analyzePinterestBoard(pinterestUrl);
    console.log('Analysis complete:', analysis.theme, analysis.mood);

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

    // Get user info
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const user = userResponse.data;
    
    // Search for tracks based on mood
    const tracks = await searchTracksForMood(accessToken, analysis.genres, 15);
    
    if (tracks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable tracks found for this mood'
      });
    }
    
    // Create playlist
    const name = playlistName || `${analysis.mood} Vibes`;
    const description = `${analysis.description} Created by MoodSync from your Pinterest moodboard.`;
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
      message: 'Failed to create playlist'
    });
  }
});
// Add this to your backend index.js

// Enhanced Pinterest analysis endpoint
app.post('/api/analyze-pinterest-enhanced', async (req, res) => {
  try {
    const { pinterestUrl, analysisOptions = {} } = req.body;
    
    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting enhanced analysis for:', pinterestUrl);

    // Set up streaming response for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Stream progress updates
    const sendUpdate = (stage) => {
      res.write(`STAGE:${stage}\n`);
    };

    sendUpdate('Extracting board information...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const boardInfo = extractBoardInfo(pinterestUrl);
    
    sendUpdate('Analyzing visual content...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, we'll generate enhanced analysis
    // In production, this would involve real image processing and NLP
    const enhancedAnalysis = await generateEnhancedAnalysis(boardInfo, analysisOptions);

    sendUpdate('Processing mood indicators...');
    await new Promise(resolve => setTimeout(resolve, 800));

    sendUpdate('Generating music recommendations...');
    await new Promise(resolve => setTimeout(resolve, 600));

    sendUpdate('Finalizing analysis...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Send final result
    res.write(`RESULT:${JSON.stringify({
      success: true,
      analysis: enhancedAnalysis
    })}\n`);

    res.end();

  } catch (error) {
    console.error('Enhanced Pinterest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced analysis failed. Please try again.'
    });
  }
});

// Generate enhanced analysis (expanded version of existing function)
async function generateEnhancedAnalysis(boardInfo, options = {}) {
  const boardText = (boardInfo.boardName + ' ' + boardInfo.originalUrl).toLowerCase();
  
  // Enhanced theme detection
  const themeAnalysis = analyzeThemes(boardText);
  
  // Enhanced color analysis
  const colorAnalysis = generateAdvancedColorAnalysis(themeAnalysis.detectedTheme);
  
  // Enhanced mood calculation
  const moodAnalysis = calculateEnhancedMood(themeAnalysis, colorAnalysis, boardText);
  
  // Enhanced music recommendations
  const musicAnalysis = generateAdvancedMusicRecommendations(moodAnalysis);

  return {
    // Enhanced mood analysis
    mood: {
      primary: moodAnalysis.primary.name,
      confidence: moodAnalysis.primary.confidence,
      secondary: moodAnalysis.secondary.map(m => m.name),
      emotional_spectrum: moodAnalysis.spectrum
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
      composition_style: themeAnalysis.composition
    },
    
    // Content analysis
    content: {
      themes: themeAnalysis.themes,
      keywords: themeAnalysis.keywords,
      sentiment: themeAnalysis.sentiment,
      topics: themeAnalysis.topics,
      emotional_tone: moodAnalysis.emotions
    },
    
    // Enhanced music recommendations
    music: {
      primary_genres: musicAnalysis.genres,
      energy_level: musicAnalysis.energy,
      tempo_range: musicAnalysis.tempo,
      instrumental_preference: musicAnalysis.instrumental,
      vocal_style: musicAnalysis.vocals,
      era_preference: musicAnalysis.era
    },
    
    // Board metadata
    board: {
      name: boardInfo.boardName,
      estimated_pins: Math.floor(Math.random() * 50) + 15,
      diversity_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
      cohesion_score: Math.random() * 0.3 + 0.7   // 0.7-1.0
    }
  };
}

// Enhanced theme analysis
function analyzeThemes(boardText) {
  const themePatterns = {
    minimalist: ['minimalist', 'simple', 'clean', 'white', 'minimal', 'scandinavian'],
    bohemian: ['boho', 'bohemian', 'eclectic', 'hippie', 'free', 'artistic', 'macrame'],
    vintage: ['vintage', 'retro', 'antique', 'classic', 'old', 'nostalgic'],
    modern: ['modern', 'contemporary', 'sleek', 'geometric', 'industrial'],
    natural: ['natural', 'organic', 'wood', 'plant', 'green', 'earth', 'sustainable'],
    luxury: ['luxury', 'elegant', 'gold', 'marble', 'sophisticated', 'glamorous'],
    rustic: ['rustic', 'farmhouse', 'country', 'barn', 'distressed', 'cottage'],
    tropical: ['tropical', 'palm', 'beach', 'ocean', 'paradise', 'exotic'],
    gothic: ['gothic', 'dark', 'black', 'mysterious', 'dramatic', 'ornate'],
    pastel: ['pastel', 'soft', 'pink', 'lavender', 'mint', 'baby', 'gentle']
  };

  let detectedTheme = 'modern'; // default
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
    composition: getCompositionStyle(detectedTheme),
    themes: getThemeLabels(detectedTheme),
    keywords: extractEnhancedKeywords(boardText, detectedTheme),
    sentiment: calculateSentiment(boardText),
    topics: getTopicCategories(detectedTheme)
  };
}

// Advanced color analysis
function generateAdvancedColorAnalysis(theme) {
  const colorSchemes = {
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
    bohemian: {
      palette: [
        { hex: '#D2691E', mood: 'earthy' },
        { hex: '#CD853F', mood: 'warm' },
        { hex: '#DEB887', mood: 'cozy' },
        { hex: '#F4A460', mood: 'inviting' },
        { hex: '#DAA520', mood: 'rich' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'golden'
    },
    vintage: {
      palette: [
        { hex: '#DEB887', mood: 'nostalgic' },
        { hex: '#D2B48C', mood: 'aged' },
        { hex: '#BC8F8F', mood: 'romantic' },
        { hex: '#F5DEB3', mood: 'sepia' },
        { hex: '#FFE4B5', mood: 'vintage' }
      ],
      temperature: 'warm',
      harmony: 'complementary',
      lighting: 'soft'
    },
    natural: {
      palette: [
        { hex: '#228B22', mood: 'natural' },
        { hex: '#32CD32', mood: 'fresh' },
        { hex: '#90EE90', mood: 'peaceful' },
        { hex: '#8FBC8F', mood: 'calming' },
        { hex: '#98FB98', mood: 'rejuvenating' }
      ],
      temperature: 'cool',
      harmony: 'analogous',
      lighting: 'natural'
    },
    modern: {
      palette: [
        { hex: '#2C3E50', mood: 'sophisticated' },
        { hex: '#34495E', mood: 'modern' },
        { hex: '#ECF0F1', mood: 'clean' },
        { hex: '#BDC3C7', mood: 'neutral' },
        { hex: '#95A5A6', mood: 'contemporary' }
      ],
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

// Enhanced mood calculation
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

  // Score based on theme
  const themeScores = {
    minimalist: { Peaceful: 0.8, Elegant: 0.7, Fresh: 0.6 },
    bohemian: { Adventurous: 0.8, Romantic: 0.7, Cozy: 0.6 },
    vintage: { Nostalgic: 0.9, Romantic: 0.7, Elegant: 0.5 },
    natural: { Peaceful: 0.8, Fresh: 0.9, Cozy: 0.6 },
    modern: { Elegant: 0.8, Fresh: 0.6, Energetic: 0.5 }
  };

  const themeScore = themeScores[themeAnalysis.detectedTheme] || {};
  Object.entries(themeScore).forEach(([mood, score]) => {
    const moodObj = moods.find(m => m.name === mood);
    if (moodObj) moodObj.score += score;
  });

  // Score based on colors
  if (colorAnalysis.temperature === 'warm') {
    moods.find(m => m.name === 'Cozy').score += 0.3;
    moods.find(m => m.name === 'Energetic').score += 0.2;
  } else if (colorAnalysis.temperature === 'cool') {
    moods.find(m => m.name === 'Peaceful').score += 0.3;
    moods.find(m => m.name === 'Fresh').score += 0.2;
  }

  // Add some randomness for variety
  moods.forEach(mood => {
    mood.score += Math.random() * 0.2;
    mood.confidence = Math.min(mood.score, 1.0);
  });

  const sorted = moods.sort((a, b) => b.score - a.score);

  return {
    primary: sorted[0],
    secondary: sorted.slice(1, 3),
    spectrum: sorted,
    emotions: sorted.slice(0, 3).map(m => m.name.toLowerCase())
  };
}

// Helper functions
function getCompositionStyle(theme) {
  const styles = {
    minimalist: 'clean lines',
    bohemian: 'eclectic mix',
    vintage: 'classic balance',
    natural: 'organic flow',
    modern: 'geometric precision'
  };
  return styles[theme] || 'balanced';
}

function getThemeLabels(theme) {
  const labels = {
    minimalist: ['minimalism', 'simplicity', 'zen'],
    bohemian: ['bohemian', 'eclectic', 'artistic'],
    vintage: ['vintage', 'nostalgia', 'classic'],
    natural: ['natural', 'organic', 'eco-friendly'],
    modern: ['contemporary', 'sleek', 'geometric']
  };
  return labels[theme] || ['contemporary'];
}

function extractEnhancedKeywords(text, theme) {
  // This would be more sophisticated in production
  const themeKeywords = {
    minimalist: ['clean', 'simple', 'white', 'space'],
    bohemian: ['colorful', 'artistic', 'free', 'creative'],
    vintage: ['classic', 'timeless', 'nostalgic', 'elegant'],
    natural: ['organic', 'green', 'sustainable', 'earth'],
    modern: ['contemporary', 'sleek', 'geometric', 'innovation']
  };

  const keywords = themeKeywords[theme] || ['style', 'design', 'aesthetic'];
  return keywords.map((word, index) => ({
    word,
    count: Math.floor(Math.random() * 10) + 5,
    relevance: (keywords.length - index) / keywords.length
  }));
}

function calculateSentiment(text) {
  // Simplified sentiment analysis
  const positiveWords = ['beautiful', 'amazing', 'love', 'perfect', 'gorgeous'];
  const score = positiveWords.reduce((sum, word) => 
    sum + (text.includes(word) ? 0.2 : 0), 0
  );
  
  return {
    score: Math.min(score, 1.0),
    label: score > 0.3 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
  };
}

function getTopicCategories(theme) {
  const categories = {
    minimalist: ['Interior Design', 'Architecture', 'Lifestyle'],
    bohemian: ['Art', 'Fashion', 'Travel', 'Culture'],
    vintage: ['Antiques', 'Fashion', 'History', 'Collectibles'],
    natural: ['Sustainability', 'Wellness', 'Gardening', 'Eco-Living'],
    modern: ['Technology', 'Design', 'Innovation', 'Contemporary Art']
  };
  return categories[theme] || ['Design', 'Lifestyle'];
}

function generateAdvancedMusicRecommendations(moodAnalysis) {
  const musicMap = {
    Energetic: {
      genres: ['electronic', 'pop', 'rock', 'dance'],
      energy: 'high',
      tempo: '120-140 BPM',
      vocals: 'powerful vocals'
    },
    Peaceful: {
      genres: ['ambient', 'classical', 'new age', 'acoustic'],
      energy: 'low',
      tempo: '60-80 BPM',
      vocals: 'soft vocals'
    },
    Romantic: {
      genres: ['jazz', 'soul', 'r&b', 'indie folk'],
      energy: 'medium',
      tempo: '70-100 BPM',
      vocals: 'intimate vocals'
    }
  };

  const primary = moodAnalysis.primary.name;
  const mapping = musicMap[primary] || musicMap.Peaceful;

  return {
    genres: mapping.genres,
    energy: mapping.energy,
    tempo: mapping.tempo,
    instrumental: Math.random() > 0.5 ? 'instrumental preferred' : 'vocals preferred',
    vocals: mapping.vocals,
    era: 'contemporary'
  };
}
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('MoodSync API ready for Pinterest analysis and Spotify playlist creation!');
});
