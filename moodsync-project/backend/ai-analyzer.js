const axios = require('axios');

// AI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'anthropic'

// ===== AI ANALYSIS CACHING SYSTEM =====
const analysisCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for AI analysis results
const MAX_CACHE_SIZE = 100; // Maximum number of cached analyses

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  totalRequests: 0
};

// Cache management functions
function getCachedAnalysis(cacheKey) {
  const cached = analysisCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🤖 Using cached AI analysis for: ${cacheKey.substring(0, 50)}...`);
    cacheStats.hits++;
    return cached.data;
  }
  
  cacheStats.misses++;
  return null;
}

function setCachedAnalysis(cacheKey, data) {
  // Clean up old entries if cache is too large
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
    console.log(`🗑️ Removed oldest cached analysis to make room`);
  }
  
  analysisCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached AI analysis for: ${cacheKey.substring(0, 50)}...`);
}

function generateAnalysisCacheKey(visualAnalysis, boardInfo) {
  // Create a unique cache key based on the analysis inputs
  const keyComponents = [
    boardInfo.boardName || '',
    boardInfo.username || '',
    boardInfo.url || '',
    JSON.stringify(visualAnalysis.dominantColors || []),
    JSON.stringify(visualAnalysis.objects || []),
    JSON.stringify(visualAnalysis.activities || []),
    JSON.stringify(visualAnalysis.settings || []),
    visualAnalysis.mood?.primary || '',
    visualAnalysis.visualElements?.colorTemperature || ''
  ];
  
  // Create a hash-like key (simple but effective for our use case)
  const keyString = keyComponents.join('|');
  return Buffer.from(keyString).toString('base64').substring(0, 64);
}

function clearExpiredAnalysisCache() {
  const now = Date.now();
  let clearedCount = 0;
  
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      analysisCache.delete(key);
      clearedCount++;
    }
  }
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} expired AI analysis cache entries`);
  }
}

// Clear expired cache entries every 30 minutes
setInterval(clearExpiredAnalysisCache, 30 * 60 * 1000);

function getCacheStats() {
  const hitRate = cacheStats.totalRequests > 0 ? 
    ((cacheStats.hits / cacheStats.totalRequests) * 100).toFixed(1) : 0;
  
  return {
    currentSize: analysisCache.size,
    maxSize: MAX_CACHE_SIZE,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    totalRequests: cacheStats.totalRequests,
    hitRate: `${hitRate}%`,
    cacheDuration: `${CACHE_DURATION / (60 * 60 * 1000)} hours`
  };
}

// AI-powered music recommendation system
class AIAnalyzer {
  constructor() {
    this.provider = AI_PROVIDER;
    this.openaiKey = OPENAI_API_KEY;
    this.anthropicKey = ANTHROPIC_API_KEY;
  }

  // Main method to generate AI-powered recommendations
  async generateRecommendations(visualAnalysis, boardInfo) {
    cacheStats.totalRequests++; // Increment total requests for cache stats
    try {
      console.log('🤖 Generating AI-powered music recommendations...');
      console.log('🔧 AI Configuration:', {
        provider: this.provider,
        hasOpenAIKey: !!this.openaiKey,
        hasAnthropicKey: !!this.anthropicKey,
        openaiKeyLength: this.openaiKey ? this.openaiKey.length : 0,
        anthropicKeyLength: this.anthropicKey ? this.anthropicKey.length : 0
      });
      
      // 🎯 CHECK CACHE FIRST
      const cacheKey = generateAnalysisCacheKey(visualAnalysis, boardInfo);
      const cachedResult = getCachedAnalysis(cacheKey);
      
      if (cachedResult) {
        console.log('✅ Returning cached AI analysis result');
        return cachedResult;
      }
      
      let result;
      
      if (this.provider === 'openai' && this.openaiKey) {
        console.log('🤖 Using OpenAI GPT-4...');
        result = await this.generateOpenAIRecommendations(visualAnalysis, boardInfo);
      } else if (this.provider === 'anthropic' && this.anthropicKey) {
        console.log('🤖 Using Anthropic Claude...');
        result = await this.generateClaudeRecommendations(visualAnalysis, boardInfo);
      } else {
        console.log('⚠️ No AI API configured, using rule-based system');
        console.log('🔧 Provider:', this.provider);
        console.log('🔧 Has Anthropic Key:', !!this.anthropicKey);
        result = await this.generateRuleBasedRecommendations(visualAnalysis, boardInfo);
      }
      
      // 🎯 CACHE THE RESULT
      setCachedAnalysis(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ AI recommendation error:', error);
      console.log('🔄 Falling back to rule-based system');
      return await this.generateRuleBasedRecommendations(visualAnalysis, boardInfo);
    }
  }

  // Get cache statistics for monitoring
  getCacheStatistics() {
    return getCacheStats();
  }

  // OpenAI GPT-4 Analysis
  async generateOpenAIRecommendations(visualAnalysis, boardInfo) {
    const prompt = this.createAnalysisPrompt(visualAnalysis, boardInfo);
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a music recommendation expert. Analyze Pinterest board data and provide sophisticated music recommendations. 
            Return your response as a valid JSON object with the following structure:
            {
              "genres": ["genre1", "genre2", "genre3"],
              "energyLevel": "low|medium|high",
              "tempoRange": "60-80 BPM",
              "moodCharacteristics": ["mood1", "mood2"],
              "searchTerms": ["term1", "term2", "term3"],
              "audioFeatures": {
                "energy": {"min": 0.0, "max": 1.0},
                "valence": {"min": 0.0, "max": 1.0},
                "danceability": {"min": 0.0, "max": 1.0}
              },
              "reasoning": ["reason1", "reason2", "reason3"]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 OpenAI Response:', aiResponse);
      
      // Parse JSON response
      const recommendations = JSON.parse(aiResponse);
      return this.validateAndEnhanceRecommendations(recommendations);
      
    } catch (error) {
      console.error('❌ OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Anthropic Claude Analysis
  async generateClaudeRecommendations(visualAnalysis, boardInfo) {
    const prompt = this.createAnalysisPrompt(visualAnalysis, boardInfo);
    
    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nPlease respond with a valid JSON object containing music recommendations.`
          }
        ]
      }, {
        headers: {
          'x-api-key': this.anthropicKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });

      const aiResponse = response.data.content[0].text;
      console.log('🤖 Claude Response:', aiResponse);
      
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return this.validateAndEnhanceRecommendations(recommendations);
      } else {
        throw new Error('No valid JSON found in Claude response');
      }
      
    } catch (error) {
      console.error('❌ Claude API error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Rule-based fallback system (current implementation)
  async generateRuleBasedRecommendations(visualAnalysis, boardInfo) {
    const recommendations = {
      genres: [],
      energyLevel: 'medium',
      tempoRange: '80-120 BPM',
      moodCharacteristics: [],
      searchTerms: [],
      audioFeatures: {},
      reasoning: []
    };

    // 🎯 BOARD NAME ANALYSIS (HIGHEST PRIORITY)
    if (boardInfo.boardName) {
      const boardNameAnalysis = this.analyzeBoardNameForMusic(boardInfo.boardName);
      recommendations.reasoning.push(`🎯 ${boardNameAnalysis.reasoning}`);
      recommendations.genres.push(...boardNameAnalysis.genres);
      recommendations.moodCharacteristics.push(...boardNameAnalysis.moods);
      
      // PRIORITIZE board title keywords at the beginning of search terms
      recommendations.searchTerms.push(...boardNameAnalysis.primaryKeywords);
      recommendations.searchTerms.push(...boardNameAnalysis.searchTerms);
      
      recommendations.energyLevel = boardNameAnalysis.energyLevel || recommendations.energyLevel;
    }

    // Analyze colors for mood (secondary to board name)
    if (visualAnalysis.dominantColors) {
      const colorAnalysis = this.analyzeColorsForMood(visualAnalysis.dominantColors);
      recommendations.reasoning.push(`🎨 ${colorAnalysis.reasoning}`);
      recommendations.genres.push(...colorAnalysis.genres);
      recommendations.moodCharacteristics.push(...colorAnalysis.moods);
    }

    // Analyze activities
    if (visualAnalysis.activities && visualAnalysis.activities.length > 0) {
      const activityAnalysis = this.analyzeActivitiesForMusic(visualAnalysis.activities);
      recommendations.reasoning.push(`🏃‍♀️ ${activityAnalysis.reasoning}`);
      recommendations.genres.push(...activityAnalysis.genres);
      recommendations.energyLevel = activityAnalysis.energyLevel;
      recommendations.searchTerms.push(...activityAnalysis.searchTerms);
    }

    // Analyze settings
    if (visualAnalysis.settings && visualAnalysis.settings.length > 0) {
      const settingAnalysis = this.analyzeSettingsForMusic(visualAnalysis.settings);
      recommendations.reasoning.push(`🌍 ${settingAnalysis.reasoning}`);
      recommendations.genres.push(...settingAnalysis.genres);
      recommendations.searchTerms.push(...settingAnalysis.searchTerms);
    }

    // Remove duplicates and limit
    recommendations.genres = [...new Set(recommendations.genres)].slice(0, 5);
    recommendations.moodCharacteristics = [...new Set(recommendations.moodCharacteristics)].slice(0, 3);
    recommendations.searchTerms = [...new Set(recommendations.searchTerms)].slice(0, 5);

    // Set audio features based on analysis
    recommendations.audioFeatures = this.generateAudioFeatures(recommendations);

    return recommendations;
  }

  // Create comprehensive analysis prompt for AI
  createAnalysisPrompt(visualAnalysis, boardInfo) {
    return `
Yo! Let's vibe with this Pinterest board and find the perfect music match.

🎯 THE MAIN VIBE - BOARD NAME ANALYSIS:
Board Name: "${boardInfo.boardName}"
Username: ${boardInfo.username}
URL: ${boardInfo.url}

The board name is EVERYTHING - it's the vibe you're going for. 
Let's read between the lines and catch the energy you're putting out there.

WHAT WE'RE LOOKING AT:
- Colors: ${visualAnalysis.dominantColors?.map(c => c.hex).join(', ') || 'None'}
- Stuff: ${visualAnalysis.objects?.map(o => o.name).join(', ') || 'None'}
- Activities: ${visualAnalysis.activities?.map(a => a.name).join(', ') || 'None'}
- Places: ${visualAnalysis.settings?.map(s => s.name).join(', ') || 'None'}
- Mood: ${visualAnalysis.mood?.primary || 'Unknown'}
- Color Feel: ${visualAnalysis.visualElements?.colorTemperature || 'Unknown'}
- Labels: ${visualAnalysis.commonLabels?.map(l => l.name).join(', ') || 'None'}

HOW TO READ THE VIBE:
1. 🎯 BOARD NAME FIRST - What's the story behind this name? What energy is it giving off?
2. 🎨 Visual stuff should BACK UP the board name vibe, not fight it
3. Think about what this board name says about the music you want to hear
4. Let's match the energy level to the vibe you're creating

VIBE EXAMPLES:
- "Retro Rock 'n' Roll Aesthetic" → Time to rock out with some 50s swagger
- "Cozy Fall Vibes" → Perfect for those warm, fuzzy autumn feels
- "Summer Beach Party" → Let's get the party started with some tropical beats
- "Dark Academia" → Moody, intellectual vibes with a mysterious edge
- "Vintage Paris" → Sophisticated, romantic French café energy

TONE: Keep it casual, fun, and conversational. Like you're talking to a friend about music. 
Use phrases like "This vibe is giving..." or "Let's match this energy with..." or "Perfect for when you're feeling..."

Return a JSON object with this EXACT structure:
{
  "genres": ["genre1", "genre2", "genre3"],
  "energyLevel": "low|medium|high",
  "tempoRange": "60-80 BPM",
  "moodCharacteristics": ["mood1", "mood2"],
  "searchTerms": ["term1", "term2", "term3"],
  "audioFeatures": {
    "energy": {"min": 0.0, "max": 1.0},
    "valence": {"min": 0.0, "max": 1.0},
    "danceability": {"min": 0.0, "max": 1.0}
  },
  "reasoning": ["reason1", "reason2", "reason3"]
}
`;
  }

  // Validate and enhance AI recommendations
  validateAndEnhanceRecommendations(recommendations) {
    console.log('🔍 Raw AI recommendations:', recommendations);
    
    // Handle nested structure from Claude
    let musicRecs = recommendations;
    if (recommendations.musicRecommendations) {
      musicRecs = recommendations.musicRecommendations;
      console.log('📦 Extracted musicRecommendations from nested structure');
    }
    
    // Handle different field names
    const genres = musicRecs.genres || musicRecs.genre || [];
    const energyLevel = musicRecs.energyLevel || musicRecs.energy || 'medium';
    const tempoRange = musicRecs.tempoRange || musicRecs.tempo || '80-120 BPM';
    const moodCharacteristics = musicRecs.moodCharacteristics || musicRecs.moods || musicRecs.mood || [];
    const searchTerms = musicRecs.searchTerms || musicRecs.search || [];
    const audioFeatures = musicRecs.audioFeatures || {};
    const reasoning = musicRecs.reasoning || [];
    
    // Ensure required fields exist
    const validated = {
      genres: Array.isArray(genres) ? genres.slice(0, 5) : ['pop', 'indie'],
      energyLevel: energyLevel || 'medium',
      tempoRange: tempoRange || '80-120 BPM',
      moodCharacteristics: Array.isArray(moodCharacteristics) ? moodCharacteristics.slice(0, 3) : [],
      searchTerms: Array.isArray(searchTerms) ? searchTerms.slice(0, 5) : [],
      audioFeatures: audioFeatures || {},
      reasoning: Array.isArray(reasoning) ? reasoning : []
    };

    // Add AI reasoning if not present
    if (validated.reasoning.length === 0) {
      validated.reasoning.push('AI-powered analysis completed');
    }

    console.log('✅ Validated AI recommendations:', validated);
    return validated;
  }

  // Color analysis methods (from existing implementation)
  analyzeColorsForMood(colors) {
    const warmColors = colors.filter(c => this.isWarmColor(c.hex));
    const coolColors = colors.filter(c => this.isCoolColor(c.hex));
    const brightColors = colors.filter(c => this.isBrightColor(c.hex));

    const result = {
      genres: [],
      moods: [],
      reasoning: ''
    };

    if (warmColors.length > coolColors.length) {
      result.genres.push('soul', 'R&B', 'romantic', 'acoustic');
      result.moods.push('warm', 'passionate', 'cozy');
      result.reasoning = 'These warm, cozy colors are giving major soul vibes - perfect for those intimate, feel-good moments';
    } else if (coolColors.length > warmColors.length) {
      result.genres.push('ambient', 'chill', 'lo-fi', 'indie');
      result.moods.push('calm', 'peaceful', 'serene');
      result.reasoning = 'These cool, calming colors are perfect for those chill, laid-back vibes';
    }

    if (brightColors.length > 2) {
      result.genres.push('pop', 'dance', 'electronic');
      result.moods.push('energetic', 'joyful');
      result.reasoning += ' - Plus those bright pops of color are screaming high energy and good times!';
    }

    return result;
  }

  analyzeActivitiesForMusic(activities) {
    const result = {
      genres: [],
      energyLevel: 'medium',
      searchTerms: [],
      reasoning: ''
    };

    for (const activity of activities) {
      if (activity.genres) {
        result.genres.push(...activity.genres);
      }
      
      if (activity.name === 'workout') {
        result.energyLevel = 'high';
        result.searchTerms.push('energetic', 'motivational', 'upbeat');
      } else if (activity.name === 'relaxation') {
        result.energyLevel = 'low';
        result.searchTerms.push('calm', 'peaceful', 'ambient');
      }
    }

    const activityNames = activities.map(a => a.name).join(', ');
    result.reasoning = `I'm seeing some ${activityNames} vibes here - this is totally shaping the music mood!`;
    return result;
  }

  // 🎯 Enhanced board name analysis for music recommendations
  analyzeBoardNameForMusic(boardName) {
    const name = boardName.toLowerCase();
    const result = {
      genres: [],
      moods: [],
      searchTerms: [],
      primaryKeywords: [], // NEW: Primary keywords from board title
      energyLevel: 'medium',
      reasoning: ''
    };

    // Extract meaningful keywords from board name (ALWAYS do this)
    const keywords = name.split(/[\s\-_]+/).filter(word => word.length > 2);
    result.primaryKeywords = keywords; // These get top priority in search

    // Enhanced theme detection with more specific keywords
    // Retro/Vintage themes
    if (name.includes('retro') || name.includes('vintage') || name.includes('old school') || name.includes('classic')) {
      result.genres.push('rockabilly', 'doo-wop', 'vintage pop', 'classic rock');
      result.searchTerms.push('retro', 'vintage', 'oldies', 'classic', '1950s', '1960s');
      result.moods.push('nostalgic', 'timeless');
      result.energyLevel = 'medium';
      result.reasoning = 'This vibe is giving major retro energy - time to bring back the classics!';
    }

    // Rock 'n' Roll themes
    else if (name.includes('rock') || name.includes('rockabilly') || name.includes('rock and roll') || name.includes('guitar')) {
      result.genres.push('rockabilly', 'classic rock', 'rock and roll', 'blues rock');
      result.searchTerms.push('rock and roll', 'rockabilly', '1950s rock', 'classic rock', 'guitar');
      result.moods.push('energetic', 'rebellious');
      result.energyLevel = 'high';
      result.reasoning = 'Rock and roll energy detected - let\'s get this party started!';
    }

    // Cozy/Comfort themes
    else if (name.includes('cozy') || name.includes('comfort') || name.includes('warm') || name.includes('snug') || name.includes('home')) {
      result.genres.push('acoustic', 'folk', 'indie', 'ambient');
      result.searchTerms.push('cozy', 'warm', 'comfortable', 'relaxing', 'home');
      result.moods.push('cozy', 'warm', 'comfortable');
      result.energyLevel = 'low';
      result.reasoning = 'Cozy vibes detected - perfect for those warm, fuzzy feels';
    }

    // Summer/Beach themes
    else if (name.includes('summer') || name.includes('beach') || name.includes('tropical') || name.includes('vacation') || name.includes('ocean')) {
      result.genres.push('tropical', 'reggae', 'calypso', 'beach pop');
      result.searchTerms.push('summer', 'beach', 'tropical', 'vacation', 'ocean', 'island');
      result.moods.push('carefree', 'energetic', 'relaxed');
      result.energyLevel = 'medium';
      result.reasoning = 'Summer vibes detected - time to catch those beach waves!';
    }

    // Fall/Autumn themes
    else if (name.includes('fall') || name.includes('autumn') || name.includes('cozy fall') || name.includes('pumpkin')) {
      result.genres.push('folk', 'acoustic', 'indie', 'ambient');
      result.searchTerms.push('fall', 'autumn', 'cozy', 'warm', 'pumpkin');
      result.moods.push('cozy', 'melancholic', 'warm');
      result.energyLevel = 'low';
      result.reasoning = 'Fall energy detected - perfect for those crisp autumn feels';
    }

    // Dark/Academia themes
    else if (name.includes('dark') || name.includes('academia') || name.includes('gothic') || name.includes('mysterious') || name.includes('moody')) {
      result.genres.push('classical', 'indie', 'ambient', 'gothic');
      result.searchTerms.push('dark', 'mysterious', 'academic', 'gothic', 'moody');
      result.moods.push('mysterious', 'intellectual', 'melancholic');
      result.energyLevel = 'low';
      result.reasoning = 'Dark academia vibes detected - moody and mysterious energy';
    }

    // Paris/French themes
    else if (name.includes('paris') || name.includes('french') || name.includes('chic') || name.includes('sophisticated') || name.includes('elegant')) {
      result.genres.push('jazz', 'chanson', 'french pop', 'classical');
      result.searchTerms.push('paris', 'french', 'chic', 'sophisticated', 'elegant');
      result.moods.push('romantic', 'sophisticated', 'elegant');
      result.energyLevel = 'medium';
      result.reasoning = 'Paris vibes detected - sophisticated and romantic energy';
    }

    // Party/Celebration themes
    else if (name.includes('party') || name.includes('celebration') || name.includes('festive') || name.includes('dance')) {
      result.genres.push('pop', 'dance', 'electronic', 'party');
      result.searchTerms.push('party', 'celebration', 'festive', 'upbeat', 'dance');
      result.moods.push('energetic', 'joyful', 'celebratory');
      result.energyLevel = 'high';
      result.reasoning = 'Party energy detected - time to celebrate!';
    }

    // Minimalist themes
    else if (name.includes('minimal') || name.includes('simple') || name.includes('clean') || name.includes('quiet')) {
      result.genres.push('ambient', 'minimal', 'lo-fi', 'indie');
      result.searchTerms.push('minimal', 'simple', 'clean', 'ambient', 'quiet');
      result.moods.push('calm', 'peaceful', 'serene');
      result.energyLevel = 'low';
      result.reasoning = 'Minimalist vibes detected - clean and peaceful energy';
    }

    // Bohemian/Hippie themes
    else if (name.includes('bohemian') || name.includes('hippie') || name.includes('free spirit') || name.includes('natural')) {
      result.genres.push('folk', 'psychedelic', 'indie', 'acoustic');
      result.searchTerms.push('bohemian', 'hippie', 'free spirit', 'folk', 'natural');
      result.moods.push('free-spirited', 'peaceful', 'natural');
      result.energyLevel = 'medium';
      result.reasoning = 'Bohemian vibes detected - free-spirited and natural energy';
    }

    // Coffee/Cafe themes
    else if (name.includes('coffee') || name.includes('cafe') || name.includes('morning') || name.includes('breakfast')) {
      result.genres.push('coffee shop', 'acoustic', 'indie pop', 'folk');
      result.searchTerms.push('coffee', 'cafe', 'morning', 'breakfast', 'acoustic');
      result.moods.push('morning', 'contemplative', 'cozy');
      result.energyLevel = 'low';
      result.reasoning = 'Coffee shop vibes detected - perfect for those morning feels!';
    }

    // Night/Evening themes
    else if (name.includes('night') || name.includes('evening') || name.includes('late') || name.includes('moon')) {
      result.genres.push('ambient', 'lo-fi', 'chill', 'indie');
      result.searchTerms.push('night', 'evening', 'late', 'moon', 'chill');
      result.moods.push('calm', 'peaceful', 'dreamy');
      result.energyLevel = 'low';
      result.reasoning = 'Night vibes detected - perfect for those late-night feels';
    }

    // Workout/Fitness themes
    else if (name.includes('workout') || name.includes('fitness') || name.includes('gym') || name.includes('exercise')) {
      result.genres.push('workout', 'pop', 'hip hop', 'electronic');
      result.searchTerms.push('workout', 'fitness', 'gym', 'exercise', 'energetic');
      result.moods.push('energetic', 'motivated', 'pumped');
      result.energyLevel = 'high';
      result.reasoning = 'Workout energy detected - time to get pumped!';
    }

    // If no specific theme detected, still use the keywords
    else {
      result.searchTerms.push(...keywords);
      result.reasoning = `Reading the vibes from: ${keywords.join(', ')}`;
    }

    // Always add board name keywords to search terms (they get priority)
    result.searchTerms = [...result.primaryKeywords, ...result.searchTerms];

    return result;
  }

  analyzeSettingsForMusic(settings) {
    const result = {
      genres: [],
      searchTerms: [],
      reasoning: ''
    };

    for (const setting of settings) {
      if (setting.name === 'outdoor') {
        result.genres.push('folk', 'acoustic', 'nature sounds');
        result.searchTerms.push('outdoor', 'nature', 'organic');
      } else if (setting.name === 'urban') {
        result.genres.push('hip hop', 'pop', 'electronic');
        result.searchTerms.push('urban', 'city', 'modern');
      } else if (setting.name === 'home') {
        result.genres.push('acoustic', 'indie', 'cozy');
        result.searchTerms.push('home', 'comfortable', 'relaxing');
      }
    }

    const settingNames = settings.map(s => s.name).join(', ');
    result.reasoning = `The ${settingNames} atmosphere is totally setting the scene for the perfect soundtrack!`;
    return result;
  }

  generateAudioFeatures(recommendations) {
    const features = {};

    if (recommendations.energyLevel === 'high') {
      features.energy = { min: 0.7, max: 1.0 };
      features.danceability = { min: 0.6, max: 1.0 };
    } else if (recommendations.energyLevel === 'low') {
      features.energy = { min: 0.0, max: 0.4 };
      features.danceability = { min: 0.0, max: 0.5 };
    } else {
      features.energy = { min: 0.3, max: 0.7 };
      features.danceability = { min: 0.3, max: 0.7 };
    }

    if (recommendations.moodCharacteristics.some(m => ['joyful', 'excited', 'energetic'].includes(m))) {
      features.valence = { min: 0.6, max: 1.0 };
    } else if (recommendations.moodCharacteristics.some(m => ['calm', 'peaceful', 'serene'].includes(m))) {
      features.valence = { min: 0.4, max: 0.8 };
    } else {
      features.valence = { min: 0.3, max: 0.7 };
    }

    return features;
  }

  // Color utility functions
  isWarmColor(hex) {
    const rgb = this.hexToRgb(hex);
    return rgb.r > rgb.b && rgb.g > rgb.b;
  }

  isCoolColor(hex) {
    const rgb = this.hexToRgb(hex);
    return rgb.b > rgb.r && rgb.b > rgb.g;
  }

  isBrightColor(hex) {
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 150;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}

module.exports = AIAnalyzer; 