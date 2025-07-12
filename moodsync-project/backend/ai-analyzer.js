const axios = require('axios');

// AI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'anthropic'

// AI-powered music recommendation system
class AIAnalyzer {
  constructor() {
    this.provider = AI_PROVIDER;
    this.openaiKey = OPENAI_API_KEY;
    this.anthropicKey = ANTHROPIC_API_KEY;
  }

  // Main method to generate AI-powered recommendations
  async generateRecommendations(visualAnalysis, boardInfo) {
    try {
      console.log('🤖 Generating AI-powered music recommendations...');
      console.log('🔧 AI Configuration:', {
        provider: this.provider,
        hasOpenAIKey: !!this.openaiKey,
        hasAnthropicKey: !!this.anthropicKey,
        openaiKeyLength: this.openaiKey ? this.openaiKey.length : 0,
        anthropicKeyLength: this.anthropicKey ? this.anthropicKey.length : 0
      });
      
      if (this.provider === 'openai' && this.openaiKey) {
        console.log('🤖 Using OpenAI GPT-4...');
        return await this.generateOpenAIRecommendations(visualAnalysis, boardInfo);
      } else if (this.provider === 'anthropic' && this.anthropicKey) {
        console.log('🤖 Using Anthropic Claude...');
        return await this.generateClaudeRecommendations(visualAnalysis, boardInfo);
      } else {
        console.log('⚠️ No AI API configured, using rule-based system');
        console.log('🔧 Provider:', this.provider);
        console.log('🔧 Has Anthropic Key:', !!this.anthropicKey);
        return await this.generateRuleBasedRecommendations(visualAnalysis, boardInfo);
      }
    } catch (error) {
      console.error('❌ AI recommendation error:', error);
      console.log('🔄 Falling back to rule-based system');
      return await this.generateRuleBasedRecommendations(visualAnalysis, boardInfo);
    }
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

    // Analyze colors for mood
    if (visualAnalysis.dominantColors) {
      const colorAnalysis = this.analyzeColorsForMood(visualAnalysis.dominantColors);
      recommendations.reasoning.push(`Color analysis: ${colorAnalysis.reasoning}`);
      recommendations.genres.push(...colorAnalysis.genres);
      recommendations.moodCharacteristics.push(...colorAnalysis.moods);
    }

    // Analyze activities
    if (visualAnalysis.activities && visualAnalysis.activities.length > 0) {
      const activityAnalysis = this.analyzeActivitiesForMusic(visualAnalysis.activities);
      recommendations.reasoning.push(`Activity analysis: ${activityAnalysis.reasoning}`);
      recommendations.genres.push(...activityAnalysis.genres);
      recommendations.energyLevel = activityAnalysis.energyLevel;
      recommendations.searchTerms.push(...activityAnalysis.searchTerms);
    }

    // Analyze settings
    if (visualAnalysis.settings && visualAnalysis.settings.length > 0) {
      const settingAnalysis = this.analyzeSettingsForMusic(visualAnalysis.settings);
      recommendations.reasoning.push(`Setting analysis: ${settingAnalysis.reasoning}`);
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
Analyze this Pinterest board and recommend music genres and characteristics:

BOARD INFO:
- Name: ${boardInfo.boardName}
- Username: ${boardInfo.username}
- URL: ${boardInfo.url}

VISUAL ANALYSIS:
- Dominant Colors: ${visualAnalysis.dominantColors?.map(c => c.hex).join(', ') || 'None'}
- Detected Objects: ${visualAnalysis.objects?.map(o => o.name).join(', ') || 'None'}
- Activities: ${visualAnalysis.activities?.map(a => a.name).join(', ') || 'None'}
- Settings: ${visualAnalysis.settings?.map(s => s.name).join(', ') || 'None'}
- Mood Indicators: ${visualAnalysis.mood?.primary || 'Unknown'}
- Color Temperature: ${visualAnalysis.visualElements?.colorTemperature || 'Unknown'}
- Common Labels: ${visualAnalysis.commonLabels?.map(l => l.name).join(', ') || 'None'}

Please provide sophisticated music recommendations based on this visual analysis. Consider:
1. How the color palette influences mood and energy
2. What activities and settings suggest about the desired atmosphere
3. How detected objects and labels inform genre preferences
4. The overall aesthetic and lifestyle implications

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
      result.reasoning = 'Warm color palette detected';
    } else if (coolColors.length > warmColors.length) {
      result.genres.push('ambient', 'chill', 'lo-fi', 'indie');
      result.moods.push('calm', 'peaceful', 'serene');
      result.reasoning = 'Cool color palette detected';
    }

    if (brightColors.length > 2) {
      result.genres.push('pop', 'dance', 'electronic');
      result.moods.push('energetic', 'joyful');
      result.reasoning += ' - Bright colors suggest high energy';
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

    result.reasoning = `Activities detected: ${activities.map(a => a.name).join(', ')}`;
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

    result.reasoning = `Settings detected: ${settings.map(s => s.name).join(', ')}`;
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