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
      '/api/pinterest/auth-url',
      '/api/pinterest/callback',
      '/api/analyze-pinterest',
      '/api/analyze-pinterest-enhanced',
      '/api/analyze-pinterest-with-api',
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

// ADD THIS PINTEREST CODE TO YOUR backend/index.js
// Insert this code AFTER your existing Spotify endpoints and BEFORE the basic Pinterest analysis

// ===== PINTEREST API INTEGRATION =====

// Pinterest auth URL endpoint
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

// Exchange Pinterest code for access token
app.post('/api/pinterest/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔍 PINTEREST DEBUG - Starting callback');
    console.log('🔍 Code received:', code ? 'YES' : 'NO');
    console.log('🔍 Code length:', code ? code.length : 'N/A');
    console.log('🔍 Client ID:', process.env.PINTEREST_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('🔍 Client Secret:', process.env.PINTEREST_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('🔍 Redirect URI:', process.env.PINTEREST_REDIRECT_URI);
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pinterest authorization code required' 
      });
    }

    // Try multiple Pinterest OAuth formats to see which one works
    const attempts = [
      // Attempt 1: v5 with form data
      {
        name: 'v5-form',
        url: 'https://api.pinterest.com/v5/oauth/token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.PINTEREST_REDIRECT_URI,
          client_id: process.env.PINTEREST_CLIENT_ID,
          client_secret: process.env.PINTEREST_CLIENT_SECRET
        })
      },
      // Attempt 2: v5 with JSON + Basic Auth
      {
        name: 'v5-json-basic',
        url: 'https://api.pinterest.com/v5/oauth/token',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`
        },
        data: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.PINTEREST_REDIRECT_URI
        }
      },
      // Attempt 3: v3 API
      {
        name: 'v3-form',
        url: 'https://api.pinterest.com/v3/oauth/access_token/',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.PINTEREST_REDIRECT_URI,
          client_id: process.env.PINTEREST_CLIENT_ID,
          client_secret: process.env.PINTEREST_CLIENT_SECRET
        })
      }
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        console.log(`🔍 TRYING: ${attempt.name}`);
        console.log(`🔍 URL: ${attempt.url}`);
        console.log(`🔍 Headers:`, attempt.headers);
        console.log(`🔍 Data type:`, typeof attempt.data);
        
        const tokenResponse = await axios.post(attempt.url, attempt.data, {
          headers: attempt.headers
        });

        console.log(`✅ SUCCESS with ${attempt.name}!`);
        console.log('✅ Response status:', tokenResponse.status);
        console.log('✅ Response data keys:', Object.keys(tokenResponse.data));

        const { access_token, refresh_token, token_type } = tokenResponse.data;
        
        if (!access_token) {
          console.log('❌ No access_token in response:', tokenResponse.data);
          continue;
        }

        // Try to get user info
        let userData = { username: 'pinterest_user', id: 'unknown' };
        
        try {
          const userResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          userData = userResponse.data;
          console.log('✅ User data retrieved:', userData.username);
        } catch (userError) {
          console.log('⚠️ User data fetch failed, using defaults:', userError.message);
        }

        return res.json({
          success: true,
          access_token,
          refresh_token,
          token_type,
          user: userData,
          method_used: attempt.name
        });

      } catch (error) {
        console.log(`❌ FAILED: ${attempt.name}`);
        console.log(`❌ Status: ${error.response?.status}`);
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
        console.log(`❌ Full error data:`, error.response?.data);
        lastError = error;
        continue;
      }
    }

    // If all attempts failed
    console.log('❌ ALL ATTEMPTS FAILED');
    throw lastError || new Error('All Pinterest OAuth attempts failed');

  } catch (error) {
    console.error('🔍 FINAL ERROR:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to authenticate with Pinterest',
      error: error.response?.data?.message || error.message,
      debug_info: 'Check server logs for detailed attempts'
    });
  }
});

async function getBoardData(boardId, accessToken) {
  try {
    console.log('Fetching board data for:', boardId);
    
    const response = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Board data retrieved:', response.data.name);
    return response.data;
    
  } catch (error) {
    console.error('Error fetching board data:', error.response?.data || error.message);
    throw error;
  }
}

async function getBoardPins(boardId, accessToken, options = {}) {
  try {
    console.log('Fetching pins for board:', boardId);
    
    const response = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}/pins`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page_size: options.limit || 50
      }
    });
    
    console.log(`Retrieved ${response.data.items.length} pins`);
    return response.data;
    
  } catch (error) {
    console.error('Error fetching board pins:', error.response?.data || error.message);
    throw error;
  }
}

// Enhanced Pinterest analysis with API data
async function generateAPIEnhancedAnalysis(boardUrl, accessToken, options = {}) {
  console.log('🔍 Starting API-enhanced analysis for:', boardUrl);
  
  try {
    const boardInfo = await extractBoardIdFromUrl(boardUrl);
    
    if (!boardInfo) {
      console.log('Could not extract board info, falling back to text analysis');
      return await generateEnhancedAnalysis(boardUrl, options);
    }
    
    const board = await getBoardBySlug(boardInfo.username, boardInfo.boardSlug, accessToken);
    
    if (!board) {
      console.log('Board not found via API, falling back to text analysis');
      return await generateEnhancedAnalysis(boardUrl, options);
    }
    
    const boardData = await getBoardData(board.id, accessToken);
    const pinData = await getBoardPins(board.id, accessToken, { limit: 50 });
    
    // Create rich analysis text from API data
    const richAnalysisData = {
      boardName: boardData.name || '',
      boardDescription: boardData.description || '',
      pinTitles: pinData.items.map(pin => pin.title || '').filter(title => title),
      pinDescriptions: pinData.items.map(pin => pin.description || '').filter(desc => desc),
      pinCount: boardData.pin_count || 0,
      followerCount: boardData.follower_count || 0
    };
    
    const richAnalysisText = createRichAnalysisText(richAnalysisData);
    console.log('📝 Rich analysis text created:', richAnalysisText.substring(0, 200) + '...');
    
    // Use enhanced analysis with API data
    const analysis = await generateEnhancedAnalysisWithAPIData(boardUrl, richAnalysisText, richAnalysisData);
    
    console.log('✅ API-enhanced analysis completed successfully');
    return analysis;
    
  } catch (error) {
    console.error('❌ API-enhanced analysis error:', error);
    console.log('Falling back to text-only analysis');
    return await generateEnhancedAnalysis(boardUrl, options);
  }
}

function createRichAnalysisText(data) {
  const textSources = [
    data.boardName,
    data.boardDescription,
    ...data.pinTitles.slice(0, 20),
    ...data.pinDescriptions.slice(0, 15)
  ].filter(text => text && text.trim().length > 0);
  
  return textSources
    .join(' ')
    .toLowerCase()
    .replace(/[-_+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateEnhancedAnalysisWithAPIData(boardUrl, richAnalysisText, apiData) {
  console.log('🔍 Starting enhanced analysis with API data');
  
  try {
    // Extract board info
    const urlParts = boardUrl.split('/').filter(part => part && part.length > 0);
    let username = 'unknown';
    let boardName = apiData.boardName || 'unknown-board';
    
    if (boardUrl.includes('pinterest.com') && urlParts.length >= 4) {
      const pinterestIndex = urlParts.findIndex(part => part.includes('pinterest.com'));
      if (pinterestIndex >= 0) {
        username = urlParts[pinterestIndex + 1] || 'unknown';
      }
    }
    
    // Enhanced theme detection using rich text
    let detectedTheme = 'modern';
    let mood = 'Peaceful';
    let genres = ['acoustic', 'indie'];
    let energy = 'medium';
    
    // More sophisticated theme detection with API data
    if (richAnalysisText.includes('morning') || richAnalysisText.includes('sunrise') || richAnalysisText.includes('coffee')) {
      detectedTheme = 'morning';
      mood = 'Energetic';
      genres = ['indie pop', 'upbeat acoustic', 'folk pop', 'coffee shop'];
      energy = 'high';
    } else if (richAnalysisText.includes('cozy') || richAnalysisText.includes('home') || richAnalysisText.includes('comfort')) {
      detectedTheme = 'cozy';
      mood = 'Cozy';
      genres = ['acoustic', 'folk', 'lo-fi', 'indie folk'];
      energy = 'low';
    } else if (richAnalysisText.includes('minimal') || richAnalysisText.includes('clean') || richAnalysisText.includes('simple')) {
      detectedTheme = 'minimalist';
      mood = 'Peaceful';
      genres = ['ambient', 'classical', 'minimal', 'meditation'];
      energy = 'low';
    } else if (richAnalysisText.includes('vintage') || richAnalysisText.includes('retro') || richAnalysisText.includes('classic')) {
      detectedTheme = 'vintage';
      mood = 'Nostalgic';
      genres = ['jazz', 'soul', 'classic rock', 'oldies'];
      energy = 'medium';
    } else if (richAnalysisText.includes('dark') || richAnalysisText.includes('gothic') || richAnalysisText.includes('black')) {
      detectedTheme = 'dark';
      mood = 'Mysterious';
      genres = ['alternative', 'gothic', 'post-rock', 'dark electronic'];
      energy = 'medium';
    }
    
    console.log('🎨 Detected theme:', detectedTheme, 'mood:', mood);
    
    // Calculate enhanced confidence based on API data richness
    const baseConfidence = 0.8;
    const dataRichnessBoost = Math.min(
      (apiData.pinCount / 50) * 0.1 +
      (richAnalysisText.length / 1000) * 0.05 +
      (apiData.pinTitles.length / 20) * 0.05,
      0.15
    );
    const finalConfidence = Math.min(baseConfidence + dataRichnessBoost, 0.95);
    
    // Generate color palette based on theme
    const colorPalettes = {
      morning: [
        { hex: '#FFD700', mood: 'golden', name: 'Sunrise Gold' },
        { hex: '#FFA500', mood: 'energetic', name: 'Morning Orange' },
        { hex: '#FFEB3B', mood: 'bright', name: 'Sunny Yellow' },
        { hex: '#FF9800', mood: 'warm', name: 'Amber Glow' }
      ],
      cozy: [
        { hex: '#D7CCC8', mood: 'warm', name: 'Cozy Beige' },
        { hex: '#BCAAA4', mood: 'comfortable', name: 'Warm Brown' },
        { hex: '#8D6E63', mood: 'earthy', name: 'Coffee Brown' },
        { hex: '#FFF3E0', mood: 'soft', name: 'Cream' }
      ],
      minimalist: [
        { hex: '#FFFFFF', mood: 'pure', name: 'Pure White' },
        { hex: '#F5F5F5', mood: 'light', name: 'Light Gray' },
        { hex: '#E0E0E0', mood: 'neutral', name: 'Soft Gray' },
        { hex: '#BDBDBD', mood: 'calm', name: 'Medium Gray' }
      ],
      vintage: [
        { hex: '#DEB887', mood: 'nostalgic', name: 'Vintage Beige' },
        { hex: '#D2B48C', mood: 'aged', name: 'Antique Tan' },
        { hex: '#BC8F8F', mood: 'romantic', name: 'Rose Gold' },
        { hex: '#F5DEB3', mood: 'sepia', name: 'Old Paper' }
      ],
      dark: [
        { hex: '#2C3E50', mood: 'mysterious', name: 'Midnight' },
        { hex: '#34495E', mood: 'dramatic', name: 'Dark Slate' },
        { hex: '#7F8C8D', mood: 'moody', name: 'Storm Gray' },
        { hex: '#95A5A6', mood: 'atmospheric', name: 'Mist' }
      ],
      modern: [
        { hex: '#2196F3', mood: 'contemporary', name: 'Modern Blue' },
        { hex: '#4CAF50', mood: 'fresh', name: 'Fresh Green' },
        { hex: '#FF9800', mood: 'accent', name: 'Orange Accent' },
        { hex: '#9E9E9E', mood: 'neutral', name: 'Cool Gray' }
      ]
    };
    
    const palette = colorPalettes[detectedTheme] || colorPalettes.modern;
    
    return {
      mood: {
        primary: mood,
        confidence: finalConfidence,
        secondary: ['Fresh', 'Modern'],
        emotional_spectrum: [
          { name: mood, confidence: finalConfidence },
          { name: 'Fresh', confidence: finalConfidence * 0.75 },
          { name: 'Modern', confidence: finalConfidence * 0.65 },
          { name: 'Elegant', confidence: finalConfidence * 0.55 },
          { name: 'Peaceful', confidence: finalConfidence * 0.45 }
        ]
      },
      visual: {
        color_palette: palette,
        dominant_colors: palette[0],
        color_temperature: energy === 'high' ? 'warm' : 'cool',
        color_harmony: 'analogous',
        aesthetic_style: detectedTheme,
        visual_complexity: 'medium',
        lighting_mood: energy === 'high' ? 'bright' : 'soft',
        composition_style: 'balanced'
      },
      content: {
        sentiment: { score: 0.7, label: 'positive' },
        keywords: [
          { word: boardName.split(' ')[0] || 'board', count: 1 }
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
        name: boardName,
        description: apiData.boardDescription,
        url: boardUrl,
        username: username,
        pin_count: apiData.pinCount,
        follower_count: apiData.followerCount,
        detected_theme: detectedTheme,
        theme_confidence: finalConfidence,
        estimated_pins: apiData.pinCount || 25,
        diversity_score: 0.8,
        cohesion_score: 0.85
      },
      confidence: finalConfidence,
      analysis_quality: finalConfidence >= 0.8 ? 'excellent' : 'good',
      analysis_method: 'pinterest_api_enhanced',
      data_richness: {
        pin_count: apiData.pinCount,
        text_length: richAnalysisText.length,
        has_descriptions: apiData.pinDescriptions.length,
        engagement_data: true
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    throw new Error(`Enhanced analysis failed: ${error.message}`);
  }
}

// New endpoint that uses Pinterest API when available
app.post('/api/analyze-pinterest-with-api', async (req, res) => {
  try {
    const { url, pinterestToken, analysisOptions = {} } = req.body;
    
    if (!url || !url.includes('pinterest.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL'
      });
    }

    console.log('Starting Pinterest analysis for:', url);
    console.log('Pinterest token available:', !!pinterestToken);

    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let analysis;
    let method;

    if (pinterestToken && process.env.PINTEREST_CLIENT_ID !== 'placeholder_until_approved') {
      // Use API-enhanced analysis
      try {
        analysis = await generateAPIEnhancedAnalysis(url, pinterestToken, analysisOptions);
        method = 'pinterest_api_enhanced';
      } catch (apiError) {
        console.log('API analysis failed, falling back to text analysis');
        analysis = await generateEnhancedAnalysis(url, analysisOptions);
        method = 'text_fallback';
      }
    } else {
      // Use text-only analysis
      analysis = await generateEnhancedAnalysis(url, analysisOptions);
      method = 'text_only_enhanced';
    }

    res.json({
      success: true,
      analysis: analysis,
      method: method,
      api_used: !!pinterestToken && method === 'pinterest_api_enhanced',
      timestamp: new Date().toISOString()
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

// ===== END PINTEREST API INTEGRATION =====

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

// Enhanced Pinterest Analysis Algorithm with Weighted Scoring & Multi-Theme Detection

async function generateEnhancedAnalysis(pinterestUrl, options = {}) {
  console.log('🔍 Starting enhanced analysis for:', pinterestUrl);
  
  try {
    // Step 1: Enhanced URL parsing
    const boardInfo = extractBoardInfo(pinterestUrl);
    const analysisText = createAnalysisText(boardInfo);
    
    // Step 2: Multi-theme detection with weighted scoring
    const themeAnalysis = detectThemes(analysisText);
    
    // Step 3: Advanced mood calculation
    const moodAnalysis = calculateMoodSpectrum(themeAnalysis, analysisText);
    
    // Step 4: Smart music recommendations
    const musicAnalysis = generateMusicRecommendations(themeAnalysis, moodAnalysis);
    
    // Step 5: Dynamic color palette
    const colorAnalysis = generateColorPalette(themeAnalysis);
    
    // Step 6: Content insights
    const contentAnalysis = analyzeContent(analysisText, themeAnalysis);
    
    // Step 7: Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(themeAnalysis, moodAnalysis);
    
    return {
      mood: moodAnalysis,
      visual: colorAnalysis,
      content: contentAnalysis,
      music: musicAnalysis,
      board: {
        ...boardInfo,
        detected_themes: themeAnalysis.detectedThemes,
        primary_theme: themeAnalysis.primaryTheme,
        theme_confidence: themeAnalysis.confidence,
        theme_breakdown: themeAnalysis.breakdown
      },
      confidence: overallConfidence,
      analysis_quality: getQualityRating(overallConfidence),
      analysis_method: 'enhanced_multi_theme_v2',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    throw new Error(`Enhanced analysis failed: ${error.message}`);
  }
}

// ENHANCED THEME DETECTION SYSTEM
function detectThemes(analysisText) {
  // Comprehensive theme database with weighted keywords
  const themeDatabase = {
    // LIFESTYLE & ENERGY THEMES
    morning: {
      keywords: {
        // High-weight keywords (3x multiplier)
        primary: ['morning', 'sunrise', 'dawn', 'am'],
        // Medium-weight keywords (2x multiplier)  
        secondary: ['early', 'wake', 'breakfast', 'coffee', 'fresh', 'start'],
        // Standard weight keywords (1x multiplier)
        tertiary: ['person', 'vibe', 'routine', 'energy', 'bright', 'golden hour']
      },
      synonyms: ['daybreak', 'early bird', 'rise', 'first light'],
      weight: 1.2, // Theme importance multiplier
      mood_influences: { 
        Energetic: 0.9, Fresh: 0.8, Optimistic: 0.7, Active: 0.6 
      }
    },
    
    evening: {
      keywords: {
        primary: ['evening', 'sunset', 'dusk', 'twilight'],
        secondary: ['night', 'dinner', 'wine', 'candles', 'golden'],
        tertiary: ['romantic', 'soft', 'warm', 'intimate', 'cozy']
      },
      synonyms: ['nightfall', 'sundown', 'after dark'],
      weight: 1.1,
      mood_influences: { 
        Romantic: 0.8, Peaceful: 0.7, Intimate: 0.8, Cozy: 0.6 
      }
    },
    
    // AESTHETIC THEMES
    minimalist: {
      keywords: {
        primary: ['minimal', 'minimalist', 'simple', 'clean'],
        secondary: ['white', 'neutral', 'less', 'space', 'zen'],
        tertiary: ['scandinavian', 'modern', 'sleek', 'uncluttered', 'pure']
      },
      synonyms: ['stripped down', 'pared back', 'essential'],
      weight: 1.0,
      mood_influences: { 
        Peaceful: 0.9, Elegant: 0.8, Focused: 0.7, Calm: 0.8 
      }
    },
    
    maximalist: {
      keywords: {
        primary: ['maximalist', 'bold', 'eclectic', 'vibrant'],
        secondary: ['colorful', 'pattern', 'mix', 'layer', 'rich'],
        tertiary: ['ornate', 'decorative', 'luxurious', 'dramatic', 'statement']
      },
      synonyms: ['over the top', 'more is more', 'abundant'],
      weight: 1.0,
      mood_influences: { 
        Energetic: 0.8, Creative: 0.9, Bold: 0.9, Expressive: 0.8 
      }
    },
    
    vintage: {
      keywords: {
        primary: ['vintage', 'retro', 'antique', 'classic'],
        secondary: ['old', 'aged', 'nostalgic', 'timeless', 'heritage'],
        tertiary: ['throwback', 'historic', 'traditional', 'bygone', 'era']
      },
      synonyms: ['old school', 'yesteryear', 'period piece'],
      weight: 1.0,
      mood_influences: { 
        Nostalgic: 0.9, Romantic: 0.6, Elegant: 0.7, Warm: 0.6 
      }
    },
    
    // SEASONAL THEMES
    spring: {
      keywords: {
        primary: ['spring', 'bloom', 'blossom', 'fresh'],
        secondary: ['new', 'growth', 'green', 'pastel', 'flower'],
        tertiary: ['renewal', 'rebirth', 'awakening', 'flourish', 'tender']
      },
      synonyms: ['springtime', 'vernal', 'budding'],
      weight: 1.1,
      mood_influences: { 
        Fresh: 0.9, Optimistic: 0.8, Gentle: 0.7, Renewed: 0.8 
      }
    },
    
    summer: {
      keywords: {
        primary: ['summer', 'sun', 'beach', 'vacation'],
        secondary: ['hot', 'bright', 'tropical', 'festival', 'outdoor'],
        tertiary: ['poolside', 'sunny', 'warm', 'tan', 'relax']
      },
      synonyms: ['summertime', 'sunny season', 'beach season'],
      weight: 1.0,
      mood_influences: { 
        Energetic: 0.8, Joyful: 0.9, Carefree: 0.8, Vibrant: 0.7 
      }
    },
    
    autumn: {
      keywords: {
        primary: ['autumn', 'fall', 'harvest', 'cozy'],
        secondary: ['warm', 'orange', 'red', 'comfort', 'spice'],
        tertiary: ['rustic', 'earthy', 'golden', 'crisp', 'season']
      },
      synonyms: ['fall season', 'autumnal', 'harvest time'],
      weight: 1.0,
      mood_influences: { 
        Cozy: 0.9, Warm: 0.8, Nostalgic: 0.6, Comfortable: 0.8 
      }
    },
    
    winter: {
      keywords: {
        primary: ['winter', 'snow', 'cold', 'holiday'],
        secondary: ['cozy', 'warm', 'fireplace', 'blanket', 'hot'],
        tertiary: ['frost', 'icy', 'crystalline', 'peaceful', 'quiet']
      },
      synonyms: ['wintertime', 'cold season', 'snowy'],
      weight: 1.0,
      mood_influences: { 
        Peaceful: 0.8, Cozy: 0.9, Serene: 0.7, Contemplative: 0.6 
      }
    },
    
    // ACTIVITY THEMES
    workout: {
      keywords: {
        primary: ['workout', 'fitness', 'gym', 'exercise'],
        secondary: ['strong', 'health', 'active', 'training', 'sweat'],
        tertiary: ['cardio', 'strength', 'yoga', 'run', 'athletic']
      },
      synonyms: ['work out', 'get fit', 'train'],
      weight: 1.0,
      mood_influences: { 
        Energetic: 0.9, Motivated: 0.8, Strong: 0.8, Determined: 0.7 
      }
    },
    
    travel: {
      keywords: {
        primary: ['travel', 'adventure', 'explore', 'journey'],
        secondary: ['wanderlust', 'trip', 'vacation', 'discover', 'roam'],
        tertiary: ['nomad', 'backpack', 'expedition', 'quest', 'getaway']
      },
      synonyms: ['globe trotting', 'wandering', 'voyaging'],
      weight: 1.0,
      mood_influences: { 
        Adventurous: 0.9, Curious: 0.8, Free: 0.7, Excited: 0.8 
      }
    },
    
    // MOOD THEMES
    dark: {
      keywords: {
        primary: ['dark', 'gothic', 'black', 'mysterious'],
        secondary: ['moody', 'dramatic', 'intense', 'shadow', 'deep'],
        tertiary: ['brooding', 'edgy', 'alternative', 'noir', 'somber']
      },
      synonyms: ['darkcore', 'dark aesthetic', 'shadowy'],
      weight: 1.0,
      mood_influences: { 
        Mysterious: 0.9, Dramatic: 0.8, Intense: 0.8, Contemplative: 0.6 
      }
    },
    
    light: {
      keywords: {
        primary: ['light', 'bright', 'airy', 'luminous'],
        secondary: ['white', 'pure', 'clean', 'fresh', 'clear'],
        tertiary: ['ethereal', 'glowing', 'radiant', 'transparent', 'open']
      },
      synonyms: ['lightcore', 'bright aesthetic', 'illuminated'],
      weight: 1.0,
      mood_influences: { 
        Fresh: 0.9, Pure: 0.8, Optimistic: 0.7, Peaceful: 0.6 
      }
    },
    
    // PINTEREST-SPECIFIC THEMES
    aesthetic: {
      keywords: {
        primary: ['aesthetic', 'vibe', 'mood', 'style'],
        secondary: ['inspo', 'inspiration', 'look', 'theme', 'feel'],
        tertiary: ['atmosphere', 'ambiance', 'energy', 'essence', 'spirit']
      },
      synonyms: ['vibes', 'aesthetics', 'styling'],
      weight: 0.8, // Lower weight as it's very general
      mood_influences: { 
        Stylish: 0.6, Creative: 0.5, Trendy: 0.5, Artistic: 0.4 
      }
    }
  };
  
  // Calculate theme scores
  const themeScores = {};
  const detectedKeywords = {};
  
  for (const [themeName, themeData] of Object.entries(themeDatabase)) {
    let totalScore = 0;
    let matchedKeywords = [];
    
    // Check primary keywords (weight: 3)
    themeData.keywords.primary.forEach(keyword => {
      const matches = countMatches(analysisText, keyword);
      if (matches > 0) {
        totalScore += matches * 3 * themeData.weight;
        matchedKeywords.push({keyword, matches, weight: 'primary'});
      }
    });
    
    // Check secondary keywords (weight: 2)
    themeData.keywords.secondary.forEach(keyword => {
      const matches = countMatches(analysisText, keyword);
      if (matches > 0) {
        totalScore += matches * 2 * themeData.weight;
        matchedKeywords.push({keyword, matches, weight: 'secondary'});
      }
    });
    
    // Check tertiary keywords (weight: 1)
    themeData.keywords.tertiary.forEach(keyword => {
      const matches = countMatches(analysisText, keyword);
      if (matches > 0) {
        totalScore += matches * 1 * themeData.weight;
        matchedKeywords.push({keyword, matches, weight: 'tertiary'});
      }
    });
    
    // Check synonyms (weight: 1.5)
    themeData.synonyms.forEach(synonym => {
      const matches = countMatches(analysisText, synonym);
      if (matches > 0) {
        totalScore += matches * 1.5 * themeData.weight;
        matchedKeywords.push({keyword: synonym, matches, weight: 'synonym'});
      }
    });
    
    if (totalScore > 0) {
      themeScores[themeName] = totalScore;
      detectedKeywords[themeName] = matchedKeywords;
    }
  }
  
  // Sort themes by score
  const sortedThemes = Object.entries(themeScores)
    .sort(([,a], [,b]) => b - a)
    .map(([theme, score]) => ({
      theme,
      score,
      confidence: Math.min(score / 10, 1), // Normalize to 0-1
      keywords: detectedKeywords[theme],
      moodInfluences: themeDatabase[theme].mood_influences
    }));
  
  // Determine primary theme and confidence
  const primaryTheme = sortedThemes[0];
  const totalScore = Object.values(themeScores).reduce((sum, score) => sum + score, 0);
  const overallConfidence = primaryTheme ? Math.min(primaryTheme.score / Math.max(totalScore, 5), 1) : 0.1;
  
  return {
    detectedThemes: sortedThemes,
    primaryTheme: primaryTheme?.theme || 'modern',
    confidence: overallConfidence,
    breakdown: sortedThemes.slice(0, 5),
    totalMatches: totalScore,
    analysisText: analysisText
  };
}

// ADVANCED MOOD CALCULATION
function calculateMoodSpectrum(themeAnalysis, analysisText) {
  const moodMap = {
    // Energy-based moods
    Energetic: { baseScore: 0.1, keywords: ['energy', 'active', 'power', 'dynamic'] },
    Peaceful: { baseScore: 0.1, keywords: ['peace', 'calm', 'quiet', 'serene'] },
    Cozy: { baseScore: 0.1, keywords: ['cozy', 'warm', 'comfort', 'snug'] },
    
    // Emotional moods
    Romantic: { baseScore: 0.1, keywords: ['love', 'romantic', 'intimate', 'tender'] },
    Nostalgic: { baseScore: 0.1, keywords: ['nostalgic', 'memory', 'vintage', 'past'] },
    Fresh: { baseScore: 0.1, keywords: ['fresh', 'new', 'clean', 'crisp'] },
    
    // Aesthetic moods
    Elegant: { baseScore: 0.1, keywords: ['elegant', 'sophisticated', 'refined', 'classy'] },
    Dramatic: { baseScore: 0.1, keywords: ['dramatic', 'bold', 'intense', 'striking'] },
    Mysterious: { baseScore: 0.1, keywords: ['mysterious', 'dark', 'enigmatic', 'secretive'] },
    
    // Activity moods
    Adventurous: { baseScore: 0.1, keywords: ['adventure', 'explore', 'journey', 'discover'] },
    Creative: { baseScore: 0.1, keywords: ['creative', 'artistic', 'innovative', 'imaginative'] },
    Playful: { baseScore: 0.1, keywords: ['playful', 'fun', 'whimsical', 'cheerful'] }
  };
  
  // Initialize mood scores
  const moodScores = {};
  Object.keys(moodMap).forEach(mood => {
    moodScores[mood] = moodMap[mood].baseScore;
  });
  
  // Apply theme influences
  themeAnalysis.detectedThemes.forEach((themeData, index) => {
    const weight = Math.max(0.1, 1 - (index * 0.2)); // Diminishing returns
    
    if (themeData.moodInfluences) {
      Object.entries(themeData.moodInfluences).forEach(([mood, influence]) => {
        if (moodScores[mood] !== undefined) {
          moodScores[mood] += influence * weight * (themeData.confidence);
        }
      });
    }
  });
  
  // Apply direct keyword matches
  Object.entries(moodMap).forEach(([mood, data]) => {
    data.keywords.forEach(keyword => {
      const matches = countMatches(analysisText, keyword);
      if (matches > 0) {
        moodScores[mood] += matches * 0.2;
      }
    });
  });
  
  // Normalize and sort
  const maxScore = Math.max(...Object.values(moodScores));
  const spectrum = Object.entries(moodScores)
    .map(([mood, score]) => ({
      name: mood,
      confidence: Math.max(0.05, Math.min(1, score / Math.max(maxScore, 0.5)))
    }))
    .sort((a, b) => b.confidence - a.confidence);
  
  return {
    primary: spectrum[0].name,
    confidence: spectrum[0].confidence,
    secondary: spectrum.slice(1, 4).map(m => m.name),
    emotional_spectrum: spectrum,
    mood_distribution: spectrum.map(m => ({ name: m.name, score: m.confidence }))
  };
}

// SMART MUSIC RECOMMENDATIONS
function generateMusicRecommendations(themeAnalysis, moodAnalysis) {
  const musicDatabase = {
    // Theme-based genre mapping
    morning: {
      genres: ['indie pop', 'upbeat acoustic', 'folk pop', 'coffee shop', 'morning jazz'],
      energy: 'medium-high',
      tempo: '90-120 BPM',
      characteristics: ['uplifting', 'optimistic', 'fresh']
    },
    evening: {
      genres: ['smooth jazz', 'acoustic', 'soft rock', 'ambient', 'chillout'],
      energy: 'low-medium',
      tempo: '60-90 BPM',
      characteristics: ['relaxing', 'intimate', 'warm']
    },
    minimalist: {
      genres: ['ambient', 'minimal techno', 'neo-classical', 'meditation', 'atmospheric'],
      energy: 'low',
      tempo: '60-80 BPM',
      characteristics: ['spacious', 'clean', 'focused']
    },
    vintage: {
      genres: ['jazz standards', 'classic rock', 'soul', 'doo-wop', 'big band'],
      energy: 'medium',
      tempo: '80-110 BPM',
      characteristics: ['nostalgic', 'timeless', 'sophisticated']
    },
    workout: {
      genres: ['electronic dance', 'hip hop', 'rock', 'pop', 'high-energy'],
      energy: 'high',
      tempo: '120-140 BPM',
      characteristics: ['motivating', 'powerful', 'driving']
    },
    dark: {
      genres: ['dark ambient', 'post-rock', 'gothic', 'industrial', 'alternative'],
      energy: 'medium',
      tempo: '70-100 BPM',
      characteristics: ['atmospheric', 'moody', 'intense']
    }
  };
  
  // Get primary theme recommendation
  const primaryRec = musicDatabase[themeAnalysis.primaryTheme] || musicDatabase.morning;
  
  // Blend with secondary themes
  const allGenres = new Set(primaryRec.genres);
  themeAnalysis.detectedThemes.slice(1, 3).forEach(theme => {
    const rec = musicDatabase[theme.theme];
    if (rec) {
      rec.genres.forEach(genre => allGenres.add(genre));
    }
  });
  
  return {
    primary_genres: Array.from(allGenres).slice(0, 6),
    energy_level: primaryRec.energy,
    tempo_range: primaryRec.tempo,
    characteristics: primaryRec.characteristics,
    vocal_style: 'contemporary vocals',
    era_preference: 'contemporary with classics',
    mood_match: moodAnalysis.primary,
    theme_influence: themeAnalysis.primaryTheme
  };
}

// HELPER FUNCTIONS
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
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/%20/g, ' ')
    .trim();
  
  return {
    username: username,
    boardName: cleanBoardName,
    originalUrl: url,
    urlParts: urlParts.filter(part => !part.includes('pinterest') && !part.includes('http')) || []
  };
}

function createAnalysisText(boardInfo) {
  // Create comprehensive analysis text from multiple sources
  const textSources = [
    boardInfo.boardName,
    boardInfo.username,
    ...boardInfo.urlParts
  ];
  
  // Add common Pinterest board name patterns
  const expandedText = textSources.join(' ').toLowerCase()
    // Handle common separators
    .replace(/[-_+]/g, ' ')
    // Expand common abbreviations
    .replace(/\binspo\b/g, 'inspiration')
    .replace(/\baesthetic\b/g, 'aesthetic vibe')
    .replace(/\bcore\b/g, 'core aesthetic')
    .replace(/\bfit\b/g, 'outfit fitness')
    .replace(/\bdiy\b/g, 'do it yourself craft')
    // Clean up
    .replace(/\s+/g, ' ')
    .trim();
  
  return expandedText;
}

function countMatches(text, keyword) {
  // Enhanced matching that handles word boundaries and variations
  const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  const matches = text.match(regex) || [];
  return matches.length;
}

function generateColorPalette(themeAnalysis) {
  const colorDatabase = {
    morning: {
      palette: [
        { hex: '#FFD700', mood: 'golden', name: 'Sunrise Gold' },
        { hex: '#FFA500', mood: 'energetic', name: 'Morning Orange' },
        { hex: '#FFEB3B', mood: 'bright', name: 'Sunny Yellow' },
        { hex: '#FF9800', mood: 'warm', name: 'Amber Glow' },
        { hex: '#FFF8DC', mood: 'soft', name: 'Cream Light' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'bright'
    },
    evening: {
      palette: [
        { hex: '#8E4EC6', mood: 'romantic', name: 'Twilight Purple' },
        { hex: '#FF6B6B', mood: 'warm', name: 'Sunset Coral' },
        { hex: '#4ECDC4', mood: 'calming', name: 'Evening Teal' },
        { hex: '#45B7D1', mood: 'peaceful', name: 'Dusk Blue' },
        { hex: '#F7DC6F', mood: 'golden', name: 'Evening Gold' }
      ],
      temperature: 'warm',
      harmony: 'complementary',
      lighting: 'soft'
    },
    minimalist: {
      palette: [
        { hex: '#FFFFFF', mood: 'pure', name: 'Pure White' },
        { hex: '#F8F9FA', mood: 'light', name: 'Off White' },
        { hex: '#E9ECEF', mood: 'neutral', name: 'Light Gray' },
        { hex: '#DEE2E6', mood: 'calm', name: 'Silver Gray' },
        { hex: '#ADB5BD', mood: 'sophisticated', name: 'Cool Gray' }
      ],
      temperature: 'neutral',
      harmony: 'monochromatic',
      lighting: 'bright'
    },
    maximalist: {
      palette: [
        { hex: '#E74C3C', mood: 'bold', name: 'Vibrant Red' },
        { hex: '#F39C12', mood: 'energetic', name: 'Electric Orange' },
        { hex: '#F1C40F', mood: 'bright', name: 'Bold Yellow' },
        { hex: '#27AE60', mood: 'fresh', name: 'Vivid Green' },
        { hex: '#3498DB', mood: 'dynamic', name: 'Bright Blue' }
      ],
      temperature: 'warm',
      harmony: 'triadic',
      lighting: 'bright'
    },
    vintage: {
      palette: [
        { hex: '#DEB887', mood: 'nostalgic', name: 'Vintage Beige' },
        { hex: '#D2B48C', mood: 'aged', name: 'Antique Tan' },
        { hex: '#BC8F8F', mood: 'romantic', name: 'Rose Gold' },
        { hex: '#F5DEB3', mood: 'sepia', name: 'Old Paper' },
        { hex: '#CD853F', mood: 'warm', name: 'Vintage Brown' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'soft'
    },
    spring: {
      palette: [
        { hex: '#98FB98', mood: 'fresh', name: 'Spring Green' },
        { hex: '#FFB6C1', mood: 'gentle', name: 'Cherry Blossom' },
        { hex: '#E6E6FA', mood: 'soft', name: 'Lavender Mist' },
        { hex: '#F0E68C', mood: 'bright', name: 'Spring Yellow' },
        { hex: '#B0E0E6', mood: 'peaceful', name: 'Sky Blue' }
      ],
      temperature: 'cool',
      harmony: 'analogous',
      lighting: 'soft'
    },
    summer: {
      palette: [
        { hex: '#FF7F50', mood: 'vibrant', name: 'Coral Sunset' },
        { hex: '#20B2AA', mood: 'tropical', name: 'Turquoise' },
        { hex: '#FFD700', mood: 'sunny', name: 'Beach Gold' },
        { hex: '#FF69B4', mood: 'playful', name: 'Hot Pink' },
        { hex: '#00CED1', mood: 'refreshing', name: 'Ocean Blue' }
      ],
      temperature: 'warm',
      harmony: 'complementary',
      lighting: 'bright'
    },
    autumn: {
      palette: [
        { hex: '#D2691E', mood: 'warm', name: 'Autumn Orange' },
        { hex: '#B22222', mood: 'rich', name: 'Maple Red' },
        { hex: '#DAA520', mood: 'golden', name: 'Harvest Gold' },
        { hex: '#8B4513', mood: 'earthy', name: 'Chestnut Brown' },
        { hex: '#A0522D', mood: 'rustic', name: 'Sienna' }
      ],
      temperature: 'warm',
      harmony: 'analogous',
      lighting: 'warm'
    },
    winter: {
      palette: [
        { hex: '#4682B4', mood: 'cool', name: 'Winter Blue' },
        { hex: '#708090', mood: 'crisp', name: 'Frost Gray' },
        { hex: '#F0F8FF', mood: 'pure', name: 'Snow White' },
        { hex: '#2F4F4F', mood: 'deep', name: 'Winter Pine' },
        { hex: '#B0C4DE', mood: 'serene', name: 'Ice Blue' }
      ],
      temperature: 'cool',
      harmony: 'monochromatic',
      lighting: 'soft'
    },
    dark: {
      palette: [
        { hex: '#2C3E50', mood: 'mysterious', name: 'Midnight Blue' },
        { hex: '#34495E', mood: 'dramatic', name: 'Dark Slate' },
        { hex: '#7F8C8D', mood: 'moody', name: 'Shadow Gray' },
        { hex: '#95A5A6', mood: 'atmospheric', name: 'Storm Cloud' },
        { hex: '#BDC3C7', mood: 'subtle', name: 'Mist Gray' }
      ],
      temperature: 'cool',
      harmony: 'monochromatic',
      lighting: 'dim'
    },
    light: {
      palette: [
        { hex: '#FFFAF0', mood: 'pure', name: 'Ivory Light' },
        { hex: '#F0F8FF', mood: 'airy', name: 'Cloud White' },
        { hex: '#F5F5DC', mood: 'soft', name: 'Cream Beige' },
        { hex: '#FFEFD5', mood: 'gentle', name: 'Papaya Whip' },
        { hex: '#FDF5E6', mood: 'warm', name: 'Linen White' }
      ],
      temperature: 'neutral',
      harmony: 'monochromatic',
      lighting: 'bright'
    }
  };
  
  // Get primary theme colors
  const primaryColors = colorDatabase[themeAnalysis.primaryTheme] || colorDatabase.morning;
  
  // Blend with secondary themes if present
  const blendedPalette = [...primaryColors.palette];
  
  // Add accent colors from secondary themes
  themeAnalysis.detectedThemes.slice(1, 2).forEach(theme => {
    const secondaryColors = colorDatabase[theme.theme];
    if (secondaryColors && secondaryColors.palette.length > 0) {
      // Add one accent color from secondary theme
      blendedPalette.push(secondaryColors.palette[0]);
    }
  });
  
  return {
    color_palette: blendedPalette.slice(0, 6), // Limit to 6 colors
    dominant_colors: primaryColors.palette[0],
    color_temperature: primaryColors.temperature,
    color_harmony: primaryColors.harmony,
    aesthetic_style: themeAnalysis.primaryTheme,
    visual_complexity: themeAnalysis.detectedThemes.length > 2 ? 'high' : 'medium',
    lighting_mood: primaryColors.lighting,
    composition_style: getCompositionStyle(themeAnalysis.primaryTheme)
  };
}

function analyzeContent(analysisText, themeAnalysis) {
  // Enhanced sentiment analysis
  const sentiment = calculateAdvancedSentiment(analysisText);
  
  // Extract meaningful keywords
  const keywords = extractMeaningfulKeywords(analysisText, themeAnalysis);
  
  // Determine topic categories
  const topics = getTopicCategories(themeAnalysis.primaryTheme, themeAnalysis.detectedThemes);
  
  return {
    sentiment: sentiment,
    keywords: keywords,
    topics: topics,
    themes: themeAnalysis.detectedThemes.map(t => t.theme),
    emotional_tone: themeAnalysis.detectedThemes.slice(0, 3).map(t => t.theme),
    analysis_depth: themeAnalysis.detectedThemes.length,
    content_richness: keywords.length > 5 ? 'high' : 'medium'
  };
}

function calculateAdvancedSentiment(text) {
  const sentimentWords = {
    positive: {
      strong: ['amazing', 'beautiful', 'gorgeous', 'stunning', 'perfect', 'fantastic'],
      medium: ['good', 'nice', 'pretty', 'lovely', 'great', 'wonderful'],
      mild: ['okay', 'fine', 'decent', 'pleasant', 'bright', 'fresh']
    },
    negative: {
      strong: ['terrible', 'awful', 'horrible', 'disgusting', 'hate'],
      medium: ['bad', 'ugly', 'wrong', 'sad', 'dark'],
      mild: ['meh', 'boring', 'plain', 'dull', 'bland']
    },
    neutral: ['normal', 'regular', 'standard', 'basic', 'simple', 'average']
  };
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  const words = text.toLowerCase().split(/\s+/);
  
  // Calculate weighted scores
  words.forEach(word => {
    // Strong positive (weight: 3)
    if (sentimentWords.positive.strong.some(pos => word.includes(pos))) positiveScore += 3;
    // Medium positive (weight: 2)
    else if (sentimentWords.positive.medium.some(pos => word.includes(pos))) positiveScore += 2;
    // Mild positive (weight: 1)
    else if (sentimentWords.positive.mild.some(pos => word.includes(pos))) positiveScore += 1;
    
    // Strong negative (weight: 3)
    if (sentimentWords.negative.strong.some(neg => word.includes(neg))) negativeScore += 3;
    // Medium negative (weight: 2)
    else if (sentimentWords.negative.medium.some(neg => word.includes(neg))) negativeScore += 2;
    // Mild negative (weight: 1)
    else if (sentimentWords.negative.mild.some(neg => word.includes(neg))) negativeScore += 1;
    
    // Neutral
    if (sentimentWords.neutral.some(neu => word.includes(neu))) neutralScore += 1;
  });
  
  const totalScore = positiveScore - negativeScore;
  const totalWords = words.length;
  const confidence = Math.min((positiveScore + negativeScore) / totalWords * 5, 1);
  
  let label = 'neutral';
  if (totalScore > 1) label = 'positive';
  else if (totalScore < -1) label = 'negative';
  
  return {
    score: Math.max(-1, Math.min(1, totalScore / Math.max(totalWords, 5))),
    label: label,
    confidence: confidence,
    breakdown: { 
      positive: positiveScore, 
      negative: negativeScore, 
      neutral: neutralScore 
    }
  };
}

function extractMeaningfulKeywords(text, themeAnalysis) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Filter out common words
  const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'];
  
  // Count word frequency
  const wordCount = {};
  words.filter(word => !commonWords.includes(word)).forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get top keywords with theme relevance
  const sortedWords = Object.entries(wordCount)
    .map(([word, count]) => ({
      word,
      count,
      relevance: count / words.length,
      theme_related: isThemeRelated(word, themeAnalysis.primaryTheme)
    }))
    .sort((a, b) => {
      // Prioritize theme-related words and frequency
      if (a.theme_related && !b.theme_related) return -1;
      if (!a.theme_related && b.theme_related) return 1;
      return b.count - a.count;
    })
    .slice(0, 10);
  
  return sortedWords;
}

function isThemeRelated(word, primaryTheme) {
  const themeKeywords = {
    morning: ['morning', 'sunrise', 'coffee', 'breakfast', 'early', 'fresh', 'energy'],
    evening: ['evening', 'sunset', 'dinner', 'wine', 'candles', 'romantic', 'soft'],
    minimalist: ['minimal', 'simple', 'clean', 'white', 'space', 'zen'],
    vintage: ['vintage', 'retro', 'old', 'classic', 'antique', 'nostalgic'],
    spring: ['spring', 'bloom', 'fresh', 'green', 'flower', 'new'],
    summer: ['summer', 'sun', 'beach', 'hot', 'bright', 'vacation'],
    autumn: ['autumn', 'fall', 'warm', 'cozy', 'harvest', 'orange'],
    winter: ['winter', 'snow', 'cold', 'cozy', 'fireplace', 'white'],
    dark: ['dark', 'black', 'gothic', 'mysterious', 'shadow', 'dramatic'],
    workout: ['fitness', 'gym', 'strong', 'exercise', 'health', 'active']
  };
  
  const keywords = themeKeywords[primaryTheme] || [];
  return keywords.some(keyword => word.includes(keyword) || keyword.includes(word));
}

function getTopicCategories(primaryTheme, allThemes) {
  const topicDatabase = {
    morning: ['Lifestyle', 'Wellness', 'Daily Routines', 'Productivity', 'Coffee Culture'],
    evening: ['Lifestyle', 'Romance', 'Dining', 'Entertainment', 'Relaxation'],
    minimalist: ['Interior Design', 'Architecture', 'Lifestyle', 'Simplicity', 'Modern Living'],
    maximalist: ['Interior Design', 'Art', 'Fashion', 'Expression', 'Bold Design'],
    vintage: ['Fashion', 'History', 'Collectibles', 'Nostalgia', 'Classic Style'],
    spring: ['Seasonal', 'Nature', 'Renewal', 'Gardening', 'Fresh Starts'],
    summer: ['Seasonal', 'Travel', 'Outdoor Activities', 'Beach Life', 'Recreation'],
    autumn: ['Seasonal', 'Cozy Living', 'Harvest', 'Comfort', 'Nature'],
    winter: ['Seasonal', 'Holiday', 'Cozy Living', 'Winter Sports', 'Comfort'],
    workout: ['Health', 'Fitness', 'Wellness', 'Sports', 'Active Lifestyle'],
    travel: ['Travel', 'Adventure', 'Culture', 'Exploration', 'Discovery'],
    dark: ['Alternative Culture', 'Art', 'Gothic Aesthetic', 'Mystery', 'Drama'],
    light: ['Minimalism', 'Purity', 'Serenity', 'Clean Living', 'Brightness']
  };
  
  // Combine categories from all detected themes
  const allCategories = new Set();
  
  // Add primary theme categories
  const primaryCategories = topicDatabase[primaryTheme] || ['Design', 'Lifestyle'];
  primaryCategories.forEach(cat => allCategories.add(cat));
  
  // Add categories from secondary themes
  allThemes.slice(1, 3).forEach(theme => {
    const categories = topicDatabase[theme.theme] || [];
    categories.slice(0, 2).forEach(cat => allCategories.add(cat)); // Limit secondary contributions
  });
  
  return Array.from(allCategories).slice(0, 6); // Limit total categories
}

function getCompositionStyle(theme) {
  const styles = {
    morning: 'bright and uplifting with natural flow',
    evening: 'intimate and warm with soft transitions',
    minimalist: 'clean lines and abundant negative space',
    maximalist: 'rich layering and abundant visual elements',
    vintage: 'classic proportions with timeless balance',
    spring: 'fresh and organic with gentle movement',
    summer: 'vibrant and dynamic with energetic flow',
    autumn: 'warm and grounded with natural harmony',
    winter: 'serene and spacious with peaceful balance',
    dark: 'dramatic contrasts with mysterious depth',
    light: 'airy and luminous with ethereal quality',
    workout: 'dynamic and powerful with strong lines',
    travel: 'expansive and adventurous with bold perspectives'
  };
  
  return styles[theme] || 'balanced and harmonious composition';
}

function calculateOverallConfidence(themeAnalysis, moodAnalysis) {
  // Factor in multiple confidence indicators
  const themeConfidence = themeAnalysis.confidence;
  const moodConfidence = moodAnalysis.confidence;
  const themeDepth = Math.min(themeAnalysis.detectedThemes.length / 3, 1); // More themes = higher confidence
  const scoreStrength = Math.min(themeAnalysis.totalMatches / 10, 1); // More matches = higher confidence
  
  // Weighted average
  const overallConfidence = (
    themeConfidence * 0.4 +
    moodConfidence * 0.3 +
    themeDepth * 0.2 +
    scoreStrength * 0.1
  );
  
  return Math.max(0.1, Math.min(0.95, overallConfidence));
}

function getQualityRating(confidence) {
  if (confidence >= 0.8) return 'excellent';
  if (confidence >= 0.6) return 'good';
  if (confidence >= 0.4) return 'moderate';
  return 'basic';
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
