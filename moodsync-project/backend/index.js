// ENHANCED MOOD DETECTION SYSTEM WITH NLP AND VISION ANALYSIS
const visionAnalyzer = require('./claude-vision-analyzer');
const AIAnalyzer = require('./ai-analyzer');

// Initialize AI analyzer
const aiAnalyzer = new AIAnalyzer();

// ===== CACHING SYSTEM =====
const boardCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_PINS_PER_BOARD = 8; // Limit pins fetched per board

// Cache management functions
function getCachedBoard(boardId, accessToken) {
  const cacheKey = `${boardId}:${accessToken}`;
  const cached = boardCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached board data for: ${boardId}`);
    return cached.data;
  }
  
  return null;
}

function setCachedBoard(boardId, accessToken, data) {
  const cacheKey = `${boardId}:${accessToken}`;
  boardCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached board data for: ${boardId}`);
}

function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of boardCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      boardCache.delete(key);
    }
  }
}

// Clear expired cache entries every 5 minutes
setInterval(clearExpiredCache, 5 * 60 * 1000);

// ===== RATE LIMITING =====
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 requests per minute per user

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = userRequestCounts.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  // Add current request
  recentRequests.push(now);
  userRequestCounts.set(userId, recentRequests);
  return true; // Allowed
}

function detectThemes(analysisText) {
  // Comprehensive mood database with 60 moods
  const moodDatabase = {
    // ENERGY SPECTRUM (10 moods)
    euphoric: {
      keywords: ['euphoric', 'ecstatic', 'blissful', 'exhilarated', 'rapturous'],
      synonyms: ['elated', 'overjoyed', 'thrilled'],
      nlp_patterns: ['feel amazing', 'on top of world', 'pure joy'],
      weight: 1.2,
      energy: 'very-high',
      genres: ['dance', 'electronic', 'pop', 'festival', 'uplifting house']
    },
    energetic: {
      keywords: ['energetic', 'dynamic', 'vibrant', 'active', 'lively'],
      synonyms: ['vigorous', 'spirited', 'animated'],
      nlp_patterns: ['full of energy', 'ready to go', 'pumped up'],
      weight: 1.1,
      energy: 'high',
      genres: ['indie pop', 'upbeat acoustic', 'rock', 'funk']
    },
    motivated: {
      keywords: ['motivated', 'driven', 'determined', 'focused', 'ambitious'],
      synonyms: ['goal-oriented', 'purposeful', 'inspired'],
      nlp_patterns: ['get things done', 'make it happen', 'chase dreams'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['motivational', 'hip hop', 'rock', 'electronic']
    },
    balanced: {
      keywords: ['balanced', 'centered', 'stable', 'harmonious', 'grounded'],
      synonyms: ['equilibrium', 'steady', 'composed'],
      nlp_patterns: ['find balance', 'inner peace', 'steady rhythm'],
      weight: 1.0,
      energy: 'medium',
      genres: ['indie', 'alternative', 'acoustic', 'folk']
    },
    calm: {
      keywords: ['calm', 'serene', 'tranquil', 'peaceful', 'still'],
      synonyms: ['placid', 'quiet', 'restful'],
      nlp_patterns: ['take it slow', 'breathe deep', 'find peace'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['ambient', 'classical', 'meditation', 'soft acoustic']
    },
    peaceful: {
      keywords: ['peaceful', 'zen', 'mindful', 'meditative', 'soothing'],
      synonyms: ['tranquil', 'restful', 'calming'],
      nlp_patterns: ['inner calm', 'peaceful moment', 'quiet mind'],
      weight: 1.0,
      energy: 'low',
      genres: ['ambient', 'new age', 'meditation', 'nature sounds']
    },
    sleepy: {
      keywords: ['sleepy', 'drowsy', 'tired', 'relaxed', 'lazy'],
      synonyms: ['lethargic', 'languid', 'dreamy'],
      nlp_patterns: ['need rest', 'wind down', 'drift away'],
      weight: 0.9,
      energy: 'very-low',
      genres: ['lo-fi', 'ambient', 'sleep music', 'soft piano']
    },
    dreamy: {
      keywords: ['dreamy', 'ethereal', 'floating', 'otherworldly', 'surreal'],
      synonyms: ['fantastical', 'mystical', 'transcendent'],
      nlp_patterns: ['lost in thought', 'float away', 'dream state'],
      weight: 1.0,
      energy: 'low',
      genres: ['dream pop', 'ambient', 'ethereal', 'shoegaze']
    },
    restless: {
      keywords: ['restless', 'anxious', 'agitated', 'unsettled', 'fidgety'],
      synonyms: ['uneasy', 'nervous', 'jittery'],
      nlp_patterns: ['can\'t sit still', 'need to move', 'feeling antsy'],
      weight: 0.9,
      energy: 'medium-high',
      genres: ['alternative rock', 'indie', 'post-punk', 'experimental']
    },
    exhausted: {
      keywords: ['exhausted', 'drained', 'depleted', 'worn out', 'fatigued'],
      synonyms: ['spent', 'weary', 'burnt out'],
      nlp_patterns: ['need a break', 'completely drained', 'so tired'],
      weight: 0.8,
      energy: 'very-low',
      genres: ['slow acoustic', 'soft rock', 'melancholic', 'introspective']
    },

    // EMOTIONAL SPECTRUM (15 moods)
    joyful: {
      keywords: ['joyful', 'happy', 'cheerful', 'delighted', 'gleeful'],
      synonyms: ['jubilant', 'merry', 'sunny'],
      nlp_patterns: ['so happy', 'pure joy', 'can\'t stop smiling'],
      weight: 1.1,
      energy: 'high',
      genres: ['pop', 'indie pop', 'feel-good', 'upbeat folk']
    },
    content: {
      keywords: ['content', 'satisfied', 'fulfilled', 'pleasant', 'comfortable'],
      synonyms: ['gratified', 'pleased', 'at ease'],
      nlp_patterns: ['feeling good', 'life is good', 'satisfied with'],
      weight: 1.0,
      energy: 'medium',
      genres: ['acoustic', 'folk', 'indie', 'soft rock']
    },
    optimistic: {
      keywords: ['optimistic', 'hopeful', 'positive', 'upbeat', 'bright'],
      synonyms: ['encouraging', 'promising', 'confident'],
      nlp_patterns: ['looking forward', 'bright future', 'good things coming'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['indie pop', 'folk pop', 'uplifting', 'alternative']
    },
    romantic: {
      keywords: ['romantic', 'loving', 'affectionate', 'intimate', 'tender'],
      synonyms: ['passionate', 'amorous', 'devoted'],
      nlp_patterns: ['in love', 'heart full', 'romantic moment'],
      weight: 1.1,
      energy: 'medium',
      genres: ['romantic', 'soul', 'R&B', 'soft jazz', 'love songs']
    },
    passionate: {
      keywords: ['passionate', 'intense', 'fervent', 'ardent', 'fiery'],
      synonyms: ['zealous', 'burning', 'devoted'],
      nlp_patterns: ['burning desire', 'intense feeling', 'heart on fire'],
      weight: 1.1,
      energy: 'high',
      genres: ['rock', 'latin', 'flamenco', 'intense pop', 'dramatic']
    },
    melancholic: {
      keywords: ['melancholic', 'wistful', 'pensive', 'bittersweet', 'longing'],
      synonyms: ['sorrowful', 'mournful', 'reflective'],
      nlp_patterns: ['feeling blue', 'lost in thought', 'bittersweet memory'],
      weight: 1.0,
      energy: 'low',
      genres: ['indie folk', 'melancholic', 'sad songs', 'introspective']
    },
    nostalgic: {
      keywords: ['nostalgic', 'reminiscent', 'sentimental', 'yearning', 'remembering'],
      synonyms: ['wistful', 'longing', 'homesick'],
      nlp_patterns: ['miss the old days', 'remember when', 'take me back'],
      weight: 1.0,
      energy: 'medium',
      genres: ['vintage', 'classic rock', 'oldies', 'retro pop']
    },
    anxious: {
      keywords: ['anxious', 'worried', 'nervous', 'stressed', 'tense'],
      synonyms: ['apprehensive', 'uneasy', 'troubled'],
      nlp_patterns: ['feeling anxious', 'so worried', 'stressed out'],
      weight: 0.8,
      energy: 'medium-high',
      genres: ['alternative', 'indie rock', 'post-punk', 'experimental']
    },
    confident: {
      keywords: ['confident', 'self-assured', 'bold', 'fearless', 'empowered'],
      synonyms: ['assertive', 'strong', 'determined'],
      nlp_patterns: ['feeling strong', 'ready to conquer', 'unstoppable'],
      weight: 1.1,
      energy: 'high',
      genres: ['hip hop', 'rock', 'pop', 'empowerment', 'strong vocals']
    },
    vulnerable: {
      keywords: ['vulnerable', 'sensitive', 'fragile', 'delicate', 'exposed'],
      synonyms: ['tender', 'raw', 'open'],
      nlp_patterns: ['feeling exposed', 'heart on sleeve', 'raw emotion'],
      weight: 0.9,
      energy: 'low',
      genres: ['acoustic', 'singer-songwriter', 'emotional', 'soft indie']
    },
    grateful: {
      keywords: ['grateful', 'thankful', 'blessed', 'appreciative', 'fortunate'],
      synonyms: ['indebted', 'obliged', 'touched'],
      nlp_patterns: ['so grateful', 'feeling blessed', 'count my blessings'],
      weight: 1.0,
      energy: 'medium',
      genres: ['gospel', 'soul', 'folk', 'acoustic', 'uplifting']
    },
    excited: {
      keywords: ['excited', 'thrilled', 'enthusiastic', 'eager', 'pumped'],
      synonyms: ['exhilarated', 'animated', 'keyed up'],
      nlp_patterns: ['so excited', 'can\'t wait', 'thrilled about'],
      weight: 1.1,
      energy: 'high',
      genres: ['pop', 'dance', 'electronic', 'upbeat indie']
    },
    rebellious: {
      keywords: ['rebellious', 'defiant', 'revolutionary', 'fierce', 'bold'],
      synonyms: ['insurgent', 'mutinous', 'resistant'],
      nlp_patterns: ['break the rules', 'fight the system', 'rebel spirit'],
      weight: 1.0,
      energy: 'high',
      genres: ['punk', 'rock', 'alternative', 'grunge', 'metal']
    },
    empowered: {
      keywords: ['empowered', 'strong', 'independent', 'liberated', 'free'],
      synonyms: ['autonomous', 'self-reliant', 'sovereign'],
      nlp_patterns: ['feeling empowered', 'strong and free', 'own my power'],
      weight: 1.1,
      energy: 'high',
      genres: ['empowerment pop', 'strong vocals', 'R&B', 'rock']
    },
    confused: {
      keywords: ['confused', 'uncertain', 'lost', 'bewildered', 'puzzled'],
      synonyms: ['perplexed', 'disoriented', 'muddled'],
      nlp_patterns: ['don\'t know', 'feeling lost', 'so confused'],
      weight: 0.8,
      energy: 'medium',
      genres: ['experimental', 'alternative', 'indie', 'introspective']
    },

    // AESTHETIC SPECTRUM (15 moods)
    elegant: {
      keywords: ['elegant', 'sophisticated', 'refined', 'classy', 'graceful'],
      synonyms: ['stylish', 'polished', 'cultured'],
      nlp_patterns: ['so elegant', 'refined taste', 'classic style'],
      weight: 1.0,
      energy: 'medium',
      genres: ['jazz', 'classical', 'sophisticated pop', 'lounge']
    },
    minimalist: {
      keywords: ['minimalist', 'simple', 'clean', 'pure', 'essential'],
      synonyms: ['stripped', 'bare', 'uncluttered'],
      nlp_patterns: ['less is more', 'simple beauty', 'clean aesthetic'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['minimal', 'ambient', 'neo-classical', 'clean electronic']
    },
    maximalist: {
      keywords: ['maximalist', 'abundant', 'rich', 'lavish', 'ornate'],
      synonyms: ['opulent', 'extravagant', 'luxurious'],
      nlp_patterns: ['more is more', 'rich details', 'abundant beauty'],
      weight: 1.0,
      energy: 'high',
      genres: ['baroque pop', 'orchestral', 'rich production', 'layered']
    },
    vintage: {
      keywords: ['vintage', 'retro', 'classic', 'timeless', 'antique'],
      synonyms: ['old-school', 'traditional', 'heritage'],
      nlp_patterns: ['vintage vibes', 'old soul', 'classic style'],
      weight: 1.0,
      energy: 'medium',
      genres: ['vintage', 'classic rock', 'jazz standards', 'retro pop']
    },
    modern: {
      keywords: ['modern', 'contemporary', 'current', 'trendy', 'fresh'],
      synonyms: ['up-to-date', 'cutting-edge', 'new'],
      nlp_patterns: ['modern style', 'contemporary feel', 'fresh take'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['modern pop', 'electronic', 'contemporary', 'indie']
    },
    rustic: {
      keywords: ['rustic', 'earthy', 'natural', 'organic', 'raw'],
      synonyms: ['countryside', 'pastoral', 'primitive'],
      nlp_patterns: ['back to nature', 'rustic charm', 'earthy feel'],
      weight: 1.0,
      energy: 'medium',
      genres: ['folk', 'country', 'acoustic', 'americana', 'bluegrass']
    },
    urban: {
      keywords: ['urban', 'city', 'metropolitan', 'street', 'cosmopolitan'],
      synonyms: ['downtown', 'concrete', 'cityscape'],
      nlp_patterns: ['city life', 'urban jungle', 'street style'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['hip hop', 'R&B', 'electronic', 'urban pop', 'street']
    },
    bohemian: {
      keywords: ['bohemian', 'boho', 'artistic', 'free-spirited', 'unconventional'],
      synonyms: ['hippie', 'alternative', 'creative'],
      nlp_patterns: ['boho vibes', 'free spirit', 'artistic soul'],
      weight: 1.0,
      energy: 'medium',
      genres: ['indie folk', 'psychedelic', 'world music', 'alternative']
    },
    glamorous: {
      keywords: ['glamorous', 'luxurious', 'dazzling', 'sparkling', 'stunning'],
      synonyms: ['glitzy', 'fabulous', 'spectacular'],
      nlp_patterns: ['feeling glamorous', 'pure glamour', 'dazzling beauty'],
      weight: 1.1,
      energy: 'high',
      genres: ['disco', 'dance pop', 'glam rock', 'dramatic pop']
    },
    edgy: {
      keywords: ['edgy', 'bold', 'daring', 'provocative', 'cutting-edge'],
      synonyms: ['avant-garde', 'rebellious', 'unconventional'],
      nlp_patterns: ['pushing boundaries', 'edgy style', 'bold choice'],
      weight: 1.0,
      energy: 'high',
      genres: ['alternative rock', 'punk', 'experimental', 'indie']
    },
    whimsical: {
      keywords: ['whimsical', 'playful', 'quirky', 'fanciful', 'imaginative'],
      synonyms: ['capricious', 'eccentric', 'charming'],
      nlp_patterns: ['playful spirit', 'whimsical touch', 'quirky charm'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['indie pop', 'quirky folk', 'playful electronic', 'cute']
    },
    mysterious: {
      keywords: ['mysterious', 'enigmatic', 'secretive', 'dark', 'hidden'],
      synonyms: ['cryptic', 'obscure', 'shadowy'],
      nlp_patterns: ['air of mystery', 'hidden depths', 'dark secrets'],
      weight: 1.0,
      energy: 'medium',
      genres: ['dark ambient', 'gothic', 'mysterious electronic', 'noir']
    },
    ethereal: {
      keywords: ['ethereal', 'heavenly', 'angelic', 'divine', 'transcendent'],
      synonyms: ['celestial', 'otherworldly', 'spiritual'],
      nlp_patterns: ['heavenly beauty', 'ethereal quality', 'divine feeling'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['ambient', 'ethereal', 'new age', 'spiritual', 'celestial']
    },
    gritty: {
      keywords: ['gritty', 'raw', 'rough', 'unpolished', 'authentic'],
      synonyms: ['rugged', 'harsh', 'unrefined'],
      nlp_patterns: ['raw emotion', 'gritty reality', 'unfiltered truth'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['grunge', 'blues rock', 'punk', 'garage rock', 'raw']
    },
    dreamy: {
      keywords: ['dreamy', 'soft', 'hazy', 'floating', 'gentle'],
      synonyms: ['misty', 'cloudy', 'gossamer'],
      nlp_patterns: ['dream-like', 'soft focus', 'floating feeling'],
      weight: 1.0,
      energy: 'low',
      genres: ['dream pop', 'shoegaze', 'ambient pop', 'soft indie']
    },

    // SEASONAL & TEMPORAL (10 moods)
    spring: {
      keywords: ['spring', 'bloom', 'renewal', 'fresh', 'growth'],
      synonyms: ['rebirth', 'awakening', 'blossoming'],
      nlp_patterns: ['spring has sprung', 'new beginnings', 'fresh start'],
      weight: 1.1,
      energy: 'medium-high',
      genres: ['indie pop', 'folk pop', 'fresh acoustic', 'uplifting']
    },
    summer: {
      keywords: ['summer', 'sunny', 'bright', 'warm', 'tropical'],
      synonyms: ['vacation', 'beach', 'festival'],
      nlp_patterns: ['summer vibes', 'sunny days', 'beach life'],
      weight: 1.1,
      energy: 'high',
      genres: ['tropical house', 'beach pop', 'reggae', 'summer hits']
    },
    autumn: {
      keywords: ['autumn', 'fall', 'cozy', 'warm', 'harvest'],
      synonyms: ['seasonal', 'crisp', 'golden'],
      nlp_patterns: ['autumn leaves', 'cozy season', 'fall vibes'],
      weight: 1.0,
      energy: 'medium',
      genres: ['folk', 'indie folk', 'acoustic', 'cozy indie']
    },
    winter: {
      keywords: ['winter', 'cold', 'snow', 'crystalline', 'quiet'],
      synonyms: ['icy', 'frozen', 'peaceful'],
      nlp_patterns: ['winter wonderland', 'snow day', 'cold beauty'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['ambient', 'classical', 'winter folk', 'contemplative']
    },
    morning: {
      keywords: ['morning', 'sunrise', 'dawn', 'early', 'awakening'],
      synonyms: ['daybreak', 'am', 'fresh start'],
      nlp_patterns: ['morning person', 'sunrise ritual', 'new day'],
      weight: 1.1,
      energy: 'medium-high',
      genres: ['coffee shop', 'morning jazz', 'acoustic', 'indie pop']
    },
    evening: {
      keywords: ['evening', 'sunset', 'dusk', 'twilight', 'golden hour'],
      synonyms: ['nightfall', 'pm', 'end of day'],
      nlp_patterns: ['golden hour', 'evening ritual', 'sunset walk'],
      weight: 1.0,
      energy: 'medium',
      genres: ['smooth jazz', 'acoustic', 'chill', 'evening classics']
    },
    midnight: {
      keywords: ['midnight', 'late night', 'after hours', 'nocturnal', 'dark'],
      synonyms: ['witching hour', 'small hours', 'deep night'],
      nlp_patterns: ['midnight thoughts', 'late night vibes', 'after hours'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['late night', 'ambient', 'downtempo', 'nocturnal']
    },
    timeless: {
      keywords: ['timeless', 'eternal', 'enduring', 'classic', 'ageless'],
      synonyms: ['everlasting', 'immortal', 'permanent'],
      nlp_patterns: ['stands the test', 'never goes out', 'timeless beauty'],
      weight: 1.0,
      energy: 'medium',
      genres: ['classics', 'standards', 'timeless hits', 'enduring']
    },
    fleeting: {
      keywords: ['fleeting', 'temporary', 'brief', 'momentary', 'passing'],
      synonyms: ['ephemeral', 'transient', 'short-lived'],
      nlp_patterns: ['in the moment', 'here and gone', 'brief moment'],
      weight: 0.9,
      energy: 'medium',
      genres: ['indie', 'experimental', 'ambient', 'contemplative']
    },
    cyclical: {
      keywords: ['cyclical', 'recurring', 'repetitive', 'circular', 'returning'],
      synonyms: ['periodic', 'rhythmic', 'recurrent'],
      nlp_patterns: ['comes around', 'full circle', 'cycle repeats'],
      weight: 1.0,
      energy: 'medium',
      genres: ['minimalist', 'repetitive', 'hypnotic', 'rhythmic']
    },

    // LIFESTYLE & ACTIVITY (10 moods)
    adventurous: {
      keywords: ['adventurous', 'exploring', 'journey', 'discovery', 'wanderlust'],
      synonyms: ['daring', 'bold', 'intrepid'],
      nlp_patterns: ['adventure awaits', 'explore the world', 'journey begins'],
      weight: 1.1,
      energy: 'high',
      genres: ['world music', 'epic', 'adventure', 'uplifting rock']
    },
    creative: {
      keywords: ['creative', 'artistic', 'imaginative', 'innovative', 'inspired'],
      synonyms: ['inventive', 'original', 'visionary'],
      nlp_patterns: ['creative flow', 'artistic vision', 'inspired moment'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['experimental', 'art rock', 'creative', 'innovative']
    },
    productive: {
      keywords: ['productive', 'efficient', 'focused', 'accomplished', 'working'],
      synonyms: ['effective', 'industrious', 'busy'],
      nlp_patterns: ['getting things done', 'in the zone', 'productive day'],
      weight: 1.0,
      energy: 'medium-high',
      genres: ['focus music', 'instrumental', 'productivity', 'ambient']
    },
    social: {
      keywords: ['social', 'party', 'friends', 'gathering', 'celebration'],
      synonyms: ['communal', 'festive', 'gregarious'],
      nlp_patterns: ['good times', 'party time', 'with friends'],
      weight: 1.1,
      energy: 'high',
      genres: ['party', 'dance', 'social', 'celebration', 'fun']
    },
    introspective: {
      keywords: ['introspective', 'reflective', 'contemplative', 'thoughtful', 'inner'],
      synonyms: ['meditative', 'pensive', 'soul-searching'],
      nlp_patterns: ['deep thoughts', 'looking within', 'self reflection'],
      weight: 1.0,
      energy: 'low',
      genres: ['introspective', 'singer-songwriter', 'contemplative', 'deep']
    },
    spiritual: {
      keywords: ['spiritual', 'sacred', 'divine', 'transcendent', 'enlightened'],
      synonyms: ['holy', 'mystical', 'soulful'],
      nlp_patterns: ['spiritual journey', 'divine connection', 'sacred moment'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['spiritual', 'sacred', 'meditation', 'new age', 'gospel']
    },
    athletic: {
      keywords: ['athletic', 'fitness', 'workout', 'training', 'strong'],
      synonyms: ['sporty', 'physical', 'competitive'],
      nlp_patterns: ['get fit', 'training hard', 'athletic performance'],
      weight: 1.0,
      energy: 'high',
      genres: ['workout', 'high-energy', 'motivational', 'pump up']
    },
    studious: {
      keywords: ['studious', 'learning', 'academic', 'scholarly', 'intellectual'],
      synonyms: ['educational', 'cerebral', 'bookish'],
      nlp_patterns: ['study time', 'learning mode', 'academic focus'],
      weight: 1.0,
      energy: 'medium',
      genres: ['study music', 'classical', 'instrumental', 'focus']
    },
    luxurious: {
      keywords: ['luxurious', 'opulent', 'indulgent', 'pampered', 'lavish'],
      synonyms: ['sumptuous', 'rich', 'extravagant'],
      nlp_patterns: ['luxury living', 'indulge yourself', 'pampered life'],
      weight: 1.1,
      energy: 'medium',
      genres: ['luxury lounge', 'sophisticated', 'rich production', 'elegant']
    },
    minimalistic: {
      keywords: ['minimalistic', 'simple living', 'decluttered', 'essential', 'sparse'],
      synonyms: ['stripped down', 'bare essentials', 'unadorned'],
      nlp_patterns: ['simple life', 'less stuff', 'essential only'],
      weight: 1.0,
      energy: 'low-medium',
      genres: ['minimal', 'sparse', 'essential', 'clean sounds']
    }
  };

  // Enhanced NLP processing
  const processedText = enhancedNLP(analysisText);
  
  // Calculate theme scores with NLP enhancement
  const themeScores = {};
  const detectedKeywords = {};
  
  for (const [moodName, moodData] of Object.entries(moodDatabase)) {
    let totalScore = 0;
    let matchedKeywords = [];
    
    // Direct keyword matches (weight: 3)
    moodData.keywords.forEach(keyword => {
      const matches = countMatches(processedText.cleaned, keyword);
      if (matches > 0) {
        totalScore += matches * 3 * moodData.weight;
        matchedKeywords.push({keyword, matches, weight: 'primary'});
      }
    });
    
    // Synonym matches (weight: 2)
    moodData.synonyms.forEach(synonym => {
      const matches = countMatches(processedText.cleaned, synonym);
      if (matches > 0) {
        totalScore += matches * 2 * moodData.weight;
        matchedKeywords.push({keyword: synonym, matches, weight: 'synonym'});
      }
    });
    
    // NLP pattern matches (weight: 4 - highest because they're contextual)
    moodData.nlp_patterns.forEach(pattern => {
      const matches = countPhraseMatches(processedText.cleaned, pattern);
      if (matches > 0) {
        totalScore += matches * 4 * moodData.weight;
        matchedKeywords.push({keyword: pattern, matches, weight: 'nlp_pattern'});
      }
    });
    
    // Sentiment boost
    if (processedText.sentiment && moodData.sentiment_alignment) {
      const sentimentBoost = calculateSentimentAlignment(processedText.sentiment, moodData.sentiment_alignment);
      totalScore += sentimentBoost;
    }
    
    if (totalScore > 0) {
      themeScores[moodName] = totalScore;
      detectedKeywords[moodName] = matchedKeywords;
    }
  }
  
  // Sort moods by score
  const sortedMoods = Object.entries(themeScores)
    .sort(([,a], [,b]) => b - a)
    .map(([mood, score]) => ({
      mood,
      score,
      confidence: Math.min(score / 15, 1), // Normalized confidence
      keywords: detectedKeywords[mood],
      moodData: moodDatabase[mood]
    }));
  
  // Determine primary mood and confidence
  const primaryMood = sortedMoods[0];
  const totalScore = Object.values(themeScores).reduce((sum, score) => sum + score, 0);
  const overallConfidence = primaryMood ? Math.min(primaryMood.score / Math.max(totalScore, 10), 1) : 0.1;
  
  return {
    detectedMoods: sortedMoods,
    primaryMood: primaryMood?.mood || 'balanced',
    confidence: overallConfidence,
    breakdown: sortedMoods.slice(0, 8), // Top 8 moods
    totalMatches: totalScore,
    nlpData: processedText
  };
}

// Enhanced Natural Language Processing
function enhancedNLP(text) {
  // Text cleaning and normalization
  let cleaned = text.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // Keep apostrophes and hyphens
    .replace(/\s+/g, ' ')
    .trim();
  
  // Expand contractions
  const contractions = {
    "can't": "cannot",
    "won't": "will not",
    "n't": " not",
    "'re": " are",
    "'ve": " have",
    "'ll": " will",
    "'d": " would",
    "'m": " am",
    "let's": "let us",
    "that's": "that is",
    "there's": "there is",
    "here's": "here is",
    "what's": "what is",
    "where's": "where is",
    "how's": "how is",
    "it's": "it is"
  };
  
  Object.entries(contractions).forEach(([contraction, expansion]) => {
    cleaned = cleaned.replace(new RegExp(contraction, 'g'), expansion);
  });
  
  // Extract emotional intensifiers
  const intensifiers = {
    very: 1.3,
    extremely: 1.5,
    incredibly: 1.4,
    absolutely: 1.4,
    totally: 1.3,
    completely: 1.4,
    perfectly: 1.3,
    really: 1.2,
    quite: 1.1,
    rather: 1.1,
    pretty: 1.1,
    so: 1.2,
    super: 1.3,
    ultra: 1.4,
    mega: 1.3,
    pure: 1.2,
    deeply: 1.3,
    highly: 1.2
  };
  
  // Extract negations
  const negations = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor'];
  const hasNegation = negations.some(neg => cleaned.includes(neg));
  
  // Simple sentiment analysis
  const positiveWords = [
    'love', 'amazing', 'beautiful', 'wonderful', 'fantastic', 'great', 'excellent', 
    'perfect', 'awesome', 'brilliant', 'stunning', 'gorgeous', 'fabulous', 'incredible',
    'happy', 'joy', 'excited', 'thrilled', 'delighted', 'pleased', 'satisfied', 'content',
    'peaceful', 'calm', 'relaxed', 'comfortable', 'cozy', 'warm', 'sweet', 'lovely',
    'fresh', 'bright', 'vibrant', 'energetic', 'inspiring', 'motivating', 'uplifting'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'bad', 'worst', 'ugly',
    'sad', 'depressed', 'miserable', 'unhappy', 'disappointed', 'frustrated', 'angry',
    'stressed', 'anxious', 'worried', 'scared', 'afraid', 'nervous', 'upset', 'hurt',
    'tired', 'exhausted', 'drained', 'overwhelmed', 'confused', 'lost', 'broken'
  ];
  
  let sentimentScore = 0;
  const words = cleaned.split(' ');
  
  words.forEach((word, index) => {
    let wordScore = 0;
    
    if (positiveWords.includes(word)) {
      wordScore = 1;
    } else if (negativeWords.includes(word)) {
      wordScore = -1;
    }
    
    // Apply intensifier if present before the word
    if (index > 0 && intensifiers[words[index - 1]]) {
      wordScore *= intensifiers[words[index - 1]];
    }
    
    sentimentScore += wordScore;
  });
  
  // Apply negation adjustment
  if (hasNegation) {
    sentimentScore *= -0.5; // Flip and reduce intensity
  }
  
  // Normalize sentiment score
  const normalizedSentiment = Math.max(-1, Math.min(1, sentimentScore / Math.max(words.length, 5)));
  
  // Extract key phrases (2-4 word combinations)
  const phrases = extractKeyPhrases(cleaned);
  
  // Extract emotional context
  const emotionalContext = extractEmotionalContext(cleaned);
  
  return {
    cleaned: cleaned,
    originalLength: text.length,
    cleanedLength: cleaned.length,
    wordCount: words.length,
    sentiment: {
      score: normalizedSentiment,
      label: normalizedSentiment > 0.1 ? 'positive' : normalizedSentiment < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(normalizedSentiment)
    },
    intensifiers: Object.keys(intensifiers).filter(int => cleaned.includes(int)),
    negations: negations.filter(neg => cleaned.includes(neg)),
    keyPhrases: phrases,
    emotionalContext: emotionalContext
  };
}

// Extract meaningful phrases from text
function extractKeyPhrases(text) {
  const words = text.split(' ').filter(word => word.length > 2);
  const phrases = [];
  
  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }
  
  // Count phrase frequency
  const phraseCount = {};
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
  });
  
  // Return top phrases
  return Object.entries(phraseCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
}

// Extract emotional context indicators
function extractEmotionalContext(text) {
  const emotionalIndicators = {
    timeContext: {
      patterns: ['morning', 'evening', 'night', 'day', 'weekend', 'today', 'yesterday', 'tomorrow'],
      found: []
    },
    personalContext: {
      patterns: ['feeling', 'mood', 'emotion', 'heart', 'soul', 'mind', 'spirit'],
      found: []
    },
    socialContext: {
      patterns: ['friend', 'family', 'together', 'alone', 'relationship', 'love', 'partner'],
      found: []
    },
    activityContext: {
      patterns: ['work', 'study', 'play', 'travel', 'create', 'relax', 'exercise', 'dance'],
      found: []
    },
    spaceContext: {
      patterns: ['home', 'office', 'outside', 'nature', 'city', 'beach', 'mountain', 'room'],
      found: []
    }
  };
  
  Object.keys(emotionalIndicators).forEach(contextType => {
    emotionalIndicators[contextType].patterns.forEach(pattern => {
      if (text.includes(pattern)) {
        emotionalIndicators[contextType].found.push(pattern);
      }
    });
  });
  
  return emotionalIndicators;
}

// Count phrase matches with context awareness
function countPhraseMatches(text, phrase) {
  // Direct phrase match
  const directMatches = (text.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  
  // Partial phrase match (if phrase has multiple words)
  const words = phrase.split(' ');
  if (words.length > 1) {
    let partialScore = 0;
    const textWords = text.split(' ');
    
    // Check for words appearing in proximity (within 3 words of each other)
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];
      
      for (let j = 0; j < textWords.length - 3; j++) {
        const window = textWords.slice(j, j + 4).join(' ');
        if (window.includes(word1) && window.includes(word2)) {
          partialScore += 0.5; // Half credit for proximity matches
        }
      }
    }
    
    return directMatches + partialScore;
  }
  
  return directMatches;
}

// Calculate sentiment alignment bonus
function calculateSentimentAlignment(textSentiment, moodSentimentPreference) {
  if (!moodSentimentPreference) return 0;
  
  const alignment = Math.abs(textSentiment.score - moodSentimentPreference);
  const bonus = Math.max(0, 1 - alignment) * 2; // 0-2 point bonus for good alignment
  
  return bonus;
}

// Enhanced theme detection using the new mood system
function detectThemes(analysisText) {
  console.log('🧠 Starting enhanced NLP mood detection...');
  
  const moodAnalysis = detectThemes(analysisText);
  
  // Convert primary mood to legacy theme format for compatibility
  const legacyThemeMapping = {
    // Map new moods to old theme system for backward compatibility
    energetic: { theme: 'morning', genres: ['indie pop', 'upbeat acoustic', 'folk pop'] },
    joyful: { theme: 'morning', genres: ['pop', 'indie pop', 'feel-good'] },
    peaceful: { theme: 'minimalist', genres: ['ambient', 'classical', 'meditation'] },
    cozy: { theme: 'cozy', genres: ['acoustic', 'folk', 'lo-fi'] },
    romantic: { theme: 'evening', genres: ['romantic', 'soul', 'R&B'] },
    nostalgic: { theme: 'vintage', genres: ['vintage', 'classic rock', 'oldies'] },
    mysterious: { theme: 'dark', genres: ['dark ambient', 'gothic', 'mysterious'] },
    minimalist: { theme: 'minimalist', genres: ['minimal', 'ambient', 'neo-classical'] },
    vintage: { theme: 'vintage', genres: ['vintage', 'classic rock', 'jazz standards'] },
    modern: { theme: 'modern', genres: ['modern pop', 'electronic', 'contemporary'] },
    spring: { theme: 'spring', genres: ['indie pop', 'folk pop', 'fresh acoustic'] },
    summer: { theme: 'summer', genres: ['tropical house', 'beach pop', 'reggae'] },
    autumn: { theme: 'autumn', genres: ['folk', 'indie folk', 'acoustic'] },
    winter: { theme: 'winter', genres: ['ambient', 'classical', 'winter folk'] },
    morning: { theme: 'morning', genres: ['coffee shop', 'morning jazz', 'acoustic'] },
    evening: { theme: 'evening', genres: ['smooth jazz', 'acoustic', 'chill'] },
    adventurous: { theme: 'travel', genres: ['world music', 'epic', 'adventure'] },
    athletic: { theme: 'workout', genres: ['workout', 'high-energy', 'motivational'] }
  };
  
  const primaryMoodData = legacyThemeMapping[moodAnalysis.primaryMood] || 
                          legacyThemeMapping.balanced || 
                          { theme: 'modern', genres: ['indie', 'alternative', 'pop'] };
  
  return {
    primaryTheme: primaryMoodData.theme,
    confidence: moodAnalysis.confidence,
    themeData: {
      mood: moodAnalysis.primaryMood,
      genres: primaryMoodData.genres,
      colors: getColorsForMood(moodAnalysis.primaryMood)
    },
    enhancedMoodData: moodAnalysis // Include full mood analysis
  };
}

// Get colors for specific moods
function getColorsForMood(mood) {
  const moodColors = {
    // Energy spectrum
    euphoric: ['#FF6B9D', '#FFE66D', '#FF8E53', '#FF5722', '#E91E63'],
    energetic: ['#FFD700', '#FFA500', '#FFEB3B', '#FF9800', '#FFF8DC'],
    motivated: ['#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A'],
    balanced: ['#607D8B', '#90A4AE', '#B0BEC5', '#CFD8DC', '#ECEFF1'],
    calm: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'],
    peaceful: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A'],
    sleepy: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC'],
    dreamy: ['#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A'],
    
    // Emotional spectrum
    joyful: ['#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#CDDC39'],
    romantic: ['#E91E63', '#F06292', '#F48FB1', '#F8BBD9', '#FCE4EC'],
    nostalgic: ['#DEB887', '#D2B48C', '#BC8F8F', '#F5DEB3', '#CD853F'],
    mysterious: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'],
    
    // Seasonal
    spring: ['#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'],
    summer: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39'],
    autumn: ['#FF5722', '#FF9800', '#FFC107', '#8BC34A', '#795548'],
    winter: ['#607D8B', '#90A4AE', '#B0BEC5', '#CFD8DC', '#ECEFF1'],
    
    // Default fallback
    default: ['#2196F3', '#4CAF50', '#FF9800', '#9E9E9E', '#E91E63']
  };
  
  return moodColors[mood] || moodColors.default;
}

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

// Add middleware to log all requests to Pinterest callback
app.use('/api/pinterest/callback', (req, res, next) => {
  console.log('🔍 Pinterest callback middleware triggered');
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request body type:', typeof req.body);
  next();
});

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

// Pinterest health check
app.get('/api/pinterest/health', (req, res) => {
  res.json({
    status: 'OK',
    pinterest_configured: !!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET),
    client_id_present: !!process.env.PINTEREST_CLIENT_ID,
    client_secret_present: !!process.env.PINTEREST_CLIENT_SECRET,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    timestamp: new Date().toISOString()
  });
});

// Test JSON parsing
app.post('/api/test-json', (req, res) => {
  console.log('Test JSON endpoint called');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  res.json({
    success: true,
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {})
  });
});

// Simple test endpoint
app.post('/api/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Simple test endpoint working',
    body: req.body,
    headers: req.headers
  });
});

// Pinterest app configuration test
app.get('/api/pinterest/test-config', (req, res) => {
  res.json({
    success: true,
    pinterest_configured: !!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET),
    client_id: process.env.PINTEREST_CLIENT_ID,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    auth_url: `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&response_type=code&scope=boards:read,pins:read,user_accounts:read`
  });
});

// Pinterest app diagnostic
app.get('/api/pinterest/diagnostic', (req, res) => {
  const diagnostic = {
    success: true,
    timestamp: new Date().toISOString(),
    configuration: {
      client_id_present: !!process.env.PINTEREST_CLIENT_ID,
      client_secret_present: !!process.env.PINTEREST_CLIENT_SECRET,
      redirect_uri: process.env.PINTEREST_REDIRECT_URI,
      client_id: process.env.PINTEREST_CLIENT_ID
    },
    auth_url: `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&response_type=code&scope=boards:read,pins:read,user_accounts:read`,
    troubleshooting: {
      step1: "Check if app is in 'Live' mode (not 'Development')",
      step2: "Verify redirect URI matches exactly: https://moodsync-jw.netlify.app/pinterest-callback",
      step3: "Ensure required scopes are enabled: boards:read, pins:read, user_accounts:read",
      step4: "Check if app has API access permissions",
      step5: "Try creating a new Pinterest app if issues persist"
    }
  };
  
  res.json(diagnostic);
});

// ===== SPOTIFY ENDPOINTS =====

// NOTE: SPOTIFY_REDIRECT_URI must match the frontend route /spotify-callback
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
    console.log('🔍 Pinterest auth URL request received');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Origin:', req.headers.origin);
    
    if (!process.env.PINTEREST_CLIENT_ID) {
      console.error('❌ Pinterest client ID not configured');
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
    
    console.log('✅ Generated Pinterest auth URL');
    console.log('🔗 Auth URL:', authUrl);
    console.log('🔧 Client ID present:', !!process.env.PINTEREST_CLIENT_ID);
    console.log('🔧 Redirect URI:', process.env.PINTEREST_REDIRECT_URI);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Pinterest auth URL error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate Pinterest auth URL' 
    });
  }
});

app.post('/api/pinterest/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ 
        success: false, 
        message: 'No authorization code provided' 
      });
    }

    console.log('Received Pinterest authorization code:', code.substring(0, 10) + '...');

    // Use v5 endpoint with optimized timeout
    const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.PINTEREST_REDIRECT_URI
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Pinterest token exchange failed:', tokenResponse.status, errorText);
      
      // Handle specific error codes
      if (tokenResponse.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 283) {
            return res.status(400).json({
              success: false,
              message: 'Authorization code expired or invalid. Please try connecting again.',
              code: 'EXPIRED_CODE'
            });
          }
        } catch (e) {
          // If we can't parse the error, return generic message
        }
      }
      
      return res.status(tokenResponse.status).json({
        success: false,
        message: `Pinterest authentication failed: ${errorText}`,
        status: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('Pinterest token exchange successful');

    // Get user info with the access token
    const userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Failed to get user info:', userResponse.status, errorText);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user information from Pinterest',
        status: userResponse.status,
        pinterest_error: errorText
      });
    }

    const userData = await userResponse.json();
    console.log('Pinterest user info retrieved successfully');

    res.json({
      success: true,
      access_token: tokenData.access_token,
      user: {
        username: userData.username,
        full_name: userData.full_name,
        id: userData.username
      }
    });

  } catch (error) {
    console.error('Pinterest OAuth error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during Pinterest authentication'
    });
  }
});

// ===== PINTEREST API FUNCTIONS =====

async function getUserBoards(accessToken) {
  try {
    console.log('Fetching user boards from Pinterest API...');
    
    let allBoards = [];
    let bookmark = null;
    let hasMore = true;
    
    // Fetch all boards with pagination
    while (hasMore) {
      const params = {
        page_size: 25
      };
      
      if (bookmark) {
        params.bookmark = bookmark;
      }
      
      const response = await axios.get('https://api.pinterest.com/v5/boards', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: params
      });
      
      const boards = response.data.items || [];
      allBoards.push(...boards);
      
      bookmark = response.data.bookmark;
      hasMore = !!bookmark;
      
      console.log(`Fetched ${boards.length} boards (total: ${allBoards.length})`);
      
      // Safety limit to prevent infinite loops
      if (allBoards.length > 500) {
        console.log('Reached board limit of 500, stopping...');
        break;
      }
    }
    
    console.log(`Total boards found: ${allBoards.length}`);
    
    // Process boards and get thumbnails for each
    const boardsWithThumbnails = await Promise.all(
      allBoards.map(async (board) => {
        let thumbnails = [];
        
        try {
          // Get first few pins for thumbnails
          const pinsResponse = await axios.get(`https://api.pinterest.com/v5/boards/${board.id}/pins`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              page_size: 6
            }
          });
          
          console.log(`Board "${board.name}" - Found ${pinsResponse.data.items?.length || 0} pins for thumbnails`);
          
          thumbnails = pinsResponse.data.items?.map(pin => {
            // Try different image sizes in order of preference
            let imageUrl = null;
            
            if (pin.media?.images) {
              // Try these sizes in order
              const imageSizes = ['300x300', '300x', '600x', 'orig', 'original'];
              
              for (const size of imageSizes) {
                if (pin.media.images[size]?.url) {
                  imageUrl = pin.media.images[size].url;
                  break;
                }
              }
              
              // If no standard sizes, try to get any available image
              if (!imageUrl) {
                const availableSizes = Object.keys(pin.media.images);
                console.log(`Available image sizes for pin:`, availableSizes);
                if (availableSizes.length > 0) {
                  imageUrl = pin.media.images[availableSizes[0]]?.url;
                }
              }
            }
            
            console.log(`Pin "${pin.title || 'Untitled'}" - Image URL: ${imageUrl ? 'Found' : 'None'}`);
            
            return {
              id: pin.id,
              image_url: imageUrl,
              title: pin.title || '',
              description: pin.description || ''
            };
          }).filter(thumb => thumb.image_url) || [];
          
          console.log(`Board "${board.name}" - Final thumbnails: ${thumbnails.length}`);
          
        } catch (pinError) {
          console.log(`Could not fetch pins for board ${board.name}:`, pinError.response?.status, pinError.message);
        }
        
        return {
          id: board.id,
          name: board.name,
          description: board.description || '',
          pin_count: board.pin_count || 0,
          follower_count: board.follower_count || 0,
          url: `https://pinterest.com/${board.owner?.username || 'user'}/${board.name?.replace(/\s+/g, '-').toLowerCase() || board.id}/`,
          image_thumbnail_url: board.media?.image_cover_url,
          thumbnails: thumbnails,
          privacy: board.privacy || 'public',
          created_at: board.created_at,
          owner: {
            username: board.owner?.username || 'unknown',
            first_name: board.owner?.first_name || '',
            last_name: board.owner?.last_name || ''
          }
        };
      })
    );
    
    return boardsWithThumbnails;
    
  } catch (error) {
    console.error('Error fetching user boards:', error.response?.data || error.message);
    throw new Error(`Failed to fetch boards: ${error.response?.data?.message || error.message}`);
  }
}

async function getBoardById(boardId, accessToken) {
  try {
    console.log('Fetching board details for:', boardId);
    
    // Check cache first
    const cachedBoard = getCachedBoard(boardId, accessToken);
    if (cachedBoard) {
      return cachedBoard;
    }
    
    const boardResponse = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const board = boardResponse.data;
    
    // Fetch limited pins for preview (reduced from 10 to MAX_PINS_PER_BOARD)
    let pins = [];
    try {
      const pinsResponse = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}/pins`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          page_size: MAX_PINS_PER_BOARD // Use the constant instead of hardcoded 10
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
      
      console.log(`📌 Fetched ${pins.length} pins for board ${board.name} (limited to ${MAX_PINS_PER_BOARD})`);
      
    } catch (pinsError) {
      console.log('Could not fetch pins for board:', pinsError.message);
    }
    
    const boardData = {
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
    
    // Cache the board data
    setCachedBoard(boardId, accessToken, boardData);
    
    return boardData;
    
  } catch (error) {
    console.error('Error fetching board details:', error.response?.data || error.message);
    throw new Error(`Failed to fetch board: ${error.response?.data?.message || error.message}`);
  }
}

// ===== ANALYSIS FUNCTIONS =====

async function extractBoardInfo(url) {
  console.log('🔍 extractBoardInfo called with URL:', url);
  
  // Check if this is a shortlink and expand it
  let processedUrl = url;
  if (isPinterestShortlink(url)) {
    console.log('🔗 Detected Pinterest shortlink, expanding...');
    processedUrl = await expandPinterestShortlink(url);
    console.log('🔗 Expanded URL:', processedUrl);
  }
  
  const urlParts = processedUrl.split('/').filter(part => part && part.length > 0);
  let username = 'unknown';
  let boardName = 'unknown-board';
  
  console.log('🔍 URL parts:', urlParts);
  console.log('🔍 Processing URL:', processedUrl);
  
  if (processedUrl.includes('pinterest.com')) {
    const pinterestIndex = urlParts.findIndex(part => part.includes('pinterest.com'));
    console.log('🔍 Pinterest index:', pinterestIndex);
    
    if (pinterestIndex >= 0) {
      // Handle different URL patterns
      if (urlParts[pinterestIndex + 1] === 'pin') {
        // This is a pin URL, not a board URL
        console.log('⚠️ Detected pin URL, not board URL');
        throw new Error('This appears to be a Pinterest pin URL, not a board URL. Please use a board URL instead.');
      } else if (urlParts[pinterestIndex + 1] && urlParts[pinterestIndex + 2]) {
        username = urlParts[pinterestIndex + 1];
        boardName = urlParts[pinterestIndex + 2];
        console.log('✅ Extracted board info:', { username, boardName });
      } else {
        console.log('⚠️ Could not extract board info from URL parts');
        throw new Error('Could not extract board information from this Pinterest URL. Please ensure it\'s a board URL, not a pin URL.');
      }
    } else {
      console.log('⚠️ No pinterest.com found in URL parts');
      throw new Error('Invalid Pinterest URL format. Please use a board URL.');
    }
  } else {
    console.log('⚠️ URL does not contain pinterest.com');
    throw new Error('Please provide a valid Pinterest board URL.');
  }
  
  const cleanBoardName = String(boardName)
    .replace(/[-_+%20]/g, ' ')
    .trim();
  
  console.log('🎯 Final board info:', { username, boardName: cleanBoardName });
  
  return {
    username,
    boardName: cleanBoardName,
    originalUrl: url,
    processedUrl: processedUrl,
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

async function generateEnhancedAnalysisWithVision(url) {
  console.log('🔍 Starting enhanced analysis with Vision API for:', url);
  
  const boardInfo = await extractBoardInfo(url);
  const analysisText = [
    boardInfo.boardName,
    boardInfo.username,
    ...boardInfo.urlParts
  ].join(' ').toLowerCase();
  
  const themeAnalysis = detectThemes(analysisText);
  const theme = themeAnalysis.themeData;
  
  // Extract images from the board URL
  const imageUrls = await extractImagesFromBoardUrl(url);
  
  // Analyze images with Vision API if available
  let visualAnalysis = null;
  if (imageUrls.length > 0) {
    try {
      console.log(`🎨 Analyzing ${imageUrls.length} images with Claude Vision...`);
      visualAnalysis = await visionAnalyzer.analyzeMultipleImages(imageUrls, 5);
      console.log('Claude Vision analysis completed:', visualAnalysis ? 'Success' : 'Failed');
      console.log('🔍 visualAnalysis object:', visualAnalysis ? 'exists' : 'null/undefined');
    } catch (visionError) {
      console.error('Vision API error:', visionError.message);
      // Continue without vision analysis if it fails
    }
  }
  
  // Combine text-based and visual analysis
  let finalMood = theme.mood;
  let finalConfidence = themeAnalysis.confidence;
  let visualMood = null;

  // Generate AI-powered music recommendations
  let aiRecommendations = null;
  if (visualAnalysis) {
    console.log('🎯 Starting AI recommendation generation...');
    aiRecommendations = await generateAIMusicRecommendations(visualAnalysis, boardInfo);
    console.log('🎯 AI recommendations result:', aiRecommendations ? 'Success' : 'Failed');
    if (aiRecommendations) {
      console.log('🎯 AI genres:', aiRecommendations.genres);
      console.log('🎯 AI reasoning:', aiRecommendations.reasoning);
    }
  } else {
    // Fallback: generate a simple reasoning based on theme and board info
    console.log(`⚠️ Fallback AI reasoning used: No images or vision analysis available for this board. Board: ${boardInfo?.url || boardInfo?.id || 'unknown'}`);
    aiRecommendations = {
      genres: theme.genres,
      energyLevel: finalMood,
      reasoning: [
        `No images were available for AI analysis, so recommendations are based on the board's title and detected theme (${theme.primaryTheme || 'unknown'}).`,
        `Genres: ${theme.genres.join(', ')}`,
        `Mood: ${finalMood}`
      ]
    };
  }

  if (visualAnalysis) {
    visualMood = visualAnalysis.primaryMood;
    const visualConfidence = visualAnalysis.confidence;
    
    // If visual analysis has higher confidence, use it
    if (visualConfidence > finalConfidence) {
      finalMood = visualMood;
      finalConfidence = visualConfidence;
    } else {
      // Blend the moods if confidence is similar
      if (Math.abs(visualConfidence - finalConfidence) < 0.2) {
        finalMood = visualMood; // Prefer visual mood for similar confidence
        finalConfidence = Math.max(visualConfidence, finalConfidence);
      }
    }
  }

  return {
    mood: {
      primary: finalMood,
      confidence: finalConfidence,
      secondary: visualAnalysis ? [visualMood, 'Modern'] : ['Modern', 'Fresh'],
      emotional_spectrum: [
        { name: finalMood, confidence: finalConfidence },
        { name: 'Modern', confidence: 0.7 },
        { name: 'Fresh', confidence: 0.6 }
      ]
    },
    visual: {
      color_palette: visualAnalysis && Array.isArray(visualAnalysis.dominantColors) && visualAnalysis.dominantColors.length > 0
        ? visualAnalysis.dominantColors.map((hex, i) => ({
            hex,
            mood: i === 0 ? 'primary' : 'secondary',
            name: `Color ${i + 1}`
          }))
        : theme.colors.map((hex, i) => ({
            hex,
            mood: i === 0 ? 'primary' : 'secondary',
            name: `Color ${i + 1}`
          })),
      dominant_colors: visualAnalysis && Array.isArray(visualAnalysis.dominantColors) && visualAnalysis.dominantColors.length > 0
        ? { hex: visualAnalysis.dominantColors[0], name: 'Primary' }
        : { hex: theme.colors[0], name: 'Primary' },
      aesthetic_style: themeAnalysis.primaryTheme,
      visual_complexity: 'medium',
      visual_analysis: visualAnalysis ? {
        images_analyzed: visualAnalysis.imagesAnalyzed,
        total_faces: visualAnalysis.visualElements.totalFaces,
        average_brightness: visualAnalysis.visualElements.averageBrightness,
        color_diversity: visualAnalysis.visualElements.colorDiversity,
        common_labels: visualAnalysis.commonLabels.slice(0, 5),
        objects: visualAnalysis.objects || [],
        activities: visualAnalysis.activities || [],
        settings: visualAnalysis.settings || []
      } : null
    },
    content: {
      sentiment: { score: 0.7, label: 'positive' },
      keywords: [{ word: boardInfo.boardName.split(' ')[0], count: 1 }],
      topics: ['Lifestyle', 'Design', 'Mood']
    },
    music: {
      primary_genres: aiRecommendations ? aiRecommendations.genres : theme.genres,
      energy_level: aiRecommendations ? aiRecommendations.energyLevel : (finalMood === 'Energetic' ? 'high' : 'medium'),
      tempo_range: aiRecommendations ? aiRecommendations.tempoRange : (finalMood === 'Energetic' ? '120-140 BPM' : '80-110 BPM'),
      mood_characteristics: aiRecommendations ? aiRecommendations.moodCharacteristics : [],
      search_terms: aiRecommendations ? aiRecommendations.searchTerms : [],
      audio_features: aiRecommendations ? aiRecommendations.audioFeatures : {},
      ai_reasoning: aiRecommendations ? aiRecommendations.reasoning : []
    },
    board: {
      name: boardInfo.boardName,
      url: url,
      username: boardInfo.username,
      detected_theme: themeAnalysis.primaryTheme,
      theme_confidence: finalConfidence
    },
    confidence: finalConfidence,
    analysis_method: visualAnalysis ? 'url_vision_enhanced' : 'url_enhanced',
    data_source: 'url_analysis' + (visualAnalysis ? '+vision_api' : ''),
    timestamp: new Date().toISOString()
  };
}

// ===== AI-POWERED MUSIC RECOMMENDATION =====

// Generate AI-powered music recommendations based on visual analysis
async function generateAIMusicRecommendations(visualAnalysis, boardInfo) {
  try {
    console.log('🤖 Generating AI-powered music recommendations...');
    
    // Use the new AI analyzer
    const recommendations = await aiAnalyzer.generateRecommendations(visualAnalysis, boardInfo);
    
    console.log('✅ AI recommendations generated:', recommendations);
    return recommendations;
    
  } catch (error) {
    console.error('❌ AI recommendation error:', error);
    return null;
  }
}

// Create a comprehensive analysis prompt for AI
function createAnalysisPrompt(visualAnalysis, boardInfo) {
  const prompt = `
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

Please recommend:
1. Primary music genres (3-5 genres)
2. Energy level (low/medium/high)
3. Tempo range (BPM)
4. Mood characteristics
5. Specific Spotify search terms
6. Audio features to target (danceability, valence, energy, etc.)

Format as JSON with detailed reasoning.
`;

  return prompt;
}

// Sophisticated rule-based recommendation system
async function generateSophisticatedRecommendations(visualAnalysis, boardInfo) {
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
    const colorAnalysis = analyzeColorsForMood(visualAnalysis.dominantColors);
    recommendations.reasoning.push(`🎨 ${colorAnalysis.reasoning}`);
    recommendations.genres.push(...colorAnalysis.genres);
    recommendations.moodCharacteristics.push(...colorAnalysis.moods);
  }

  // Analyze activities
  if (visualAnalysis.activities && visualAnalysis.activities.length > 0) {
    const activityAnalysis = analyzeActivitiesForMusic(visualAnalysis.activities);
    recommendations.reasoning.push(`🏃‍♀️ ${activityAnalysis.reasoning}`);
    recommendations.genres.push(...activityAnalysis.genres);
    recommendations.energyLevel = activityAnalysis.energyLevel;
    recommendations.searchTerms.push(...activityAnalysis.searchTerms);
  }

  // Analyze settings
  if (visualAnalysis.settings && visualAnalysis.settings.length > 0) {
    const settingAnalysis = analyzeSettingsForMusic(visualAnalysis.settings);
    recommendations.reasoning.push(`🌍 ${settingAnalysis.reasoning}`);
    recommendations.genres.push(...settingAnalysis.genres);
    recommendations.searchTerms.push(...settingAnalysis.searchTerms);
  }

  // Analyze objects
  if (visualAnalysis.objects && visualAnalysis.objects.length > 0) {
    const objectAnalysis = analyzeObjectsForMusic(visualAnalysis.objects);
    recommendations.reasoning.push(`🎯 ${objectAnalysis.reasoning}`);
    recommendations.genres.push(...objectAnalysis.genres);
    recommendations.moodCharacteristics.push(...objectAnalysis.moods);
  }

  // Remove duplicates and limit
  recommendations.genres = [...new Set(recommendations.genres)].slice(0, 5);
  recommendations.moodCharacteristics = [...new Set(recommendations.moodCharacteristics)].slice(0, 3);
  recommendations.searchTerms = [...new Set(recommendations.searchTerms)].slice(0, 5);

  // Set audio features based on analysis
  recommendations.audioFeatures = generateAudioFeatures(recommendations);

  return recommendations;
}

// Analyze colors for mood and music recommendations
function analyzeColorsForMood(colors) {
  const warmColors = colors.filter(c => isWarmColor(c.hex));
  const coolColors = colors.filter(c => isCoolColor(c.hex));
  const brightColors = colors.filter(c => isBrightColor(c.hex));

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

// Analyze activities for music recommendations
function analyzeActivitiesForMusic(activities) {
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

// Analyze settings for music recommendations
function analyzeSettingsForMusic(settings) {
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

// Analyze objects for music recommendations
function analyzeObjectsForMusic(objects) {
  const result = {
    genres: [],
    moods: [],
    reasoning: ''
  };

  for (const obj of objects) {
    const objName = obj.name.toLowerCase();
    
    if (objName.includes('coffee') || objName.includes('tea')) {
      result.genres.push('coffee shop', 'acoustic', 'indie pop');
      result.moods.push('morning', 'contemplative');
    } else if (objName.includes('book') || objName.includes('reading')) {
      result.genres.push('ambient', 'classical', 'lo-fi');
      result.moods.push('focused', 'intellectual');
    } else if (objName.includes('art') || objName.includes('creative')) {
      result.genres.push('experimental', 'indie', 'alternative');
      result.moods.push('creative', 'inspired');
    }
  }

  const objectNames = objects.map(o => o.name).join(', ');
  result.reasoning = `These ${objectNames} are totally telling the story of what music you need right now!`;
  return result;
}

// Generate audio features based on recommendations
function generateAudioFeatures(recommendations) {
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

  // Set valence based on mood characteristics
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
function isWarmColor(hex) {
  const rgb = hexToRgb(hex);
  return rgb.r > rgb.b && rgb.g > rgb.b;
}

function isCoolColor(hex) {
  const rgb = hexToRgb(hex);
  return rgb.b > rgb.r && rgb.b > rgb.g;
}

function isBrightColor(hex) {
  const rgb = hexToRgb(hex);
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;
  return brightness > 150;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Generate virtual playlist preview without Spotify authentication
async function generateVirtualPlaylistPreview(analysis, playlistName) {
  try {
    console.log('🎵 Generating virtual playlist preview...');
    console.log('📊 Analysis data for preview:', analysis);
    console.log('📊 Analysis keys:', analysis ? Object.keys(analysis) : 'No analysis');
    console.log('📊 Analysis.music:', analysis?.music);
    console.log('📊 Analysis.mood:', analysis?.mood);
    console.log('📊 Analysis.genres:', analysis?.genres);
    
    // Use Claude's AI analysis if available, otherwise fallback
    let genres = ['pop', 'indie']; // Default fallback
    let mood = 'chill'; // Default fallback
    let energyLevel = 'medium'; // Default fallback
    let searchTerms = [];
    
    console.log('🔍 Preview analysis structure:', {
      hasMusic: !!analysis.music,
      hasPrimaryGenres: !!(analysis.music && analysis.music.primary_genres),
      hasGenres: !!(analysis.genres),
      hasSearchTerms: !!(analysis.music && analysis.music.search_terms),
      musicKeys: analysis.music ? Object.keys(analysis.music) : [],
      analysisKeys: Object.keys(analysis)
    });
    
    if (analysis.music && analysis.music.primary_genres && analysis.music.primary_genres.length > 0) {
      // Use Claude's AI recommendations
      genres = analysis.music.primary_genres;
      energyLevel = analysis.music.energy_level || 'medium';
      searchTerms = analysis.music.search_terms || [];
      console.log('🎯 Using Claude AI genres:', genres);
      console.log('🎯 Using Claude AI energy level:', energyLevel);
      console.log('🎯 Using Claude AI search terms:', searchTerms);
    } else if (analysis.genres && analysis.genres.length > 0) {
      // Fallback to old analysis format
      genres = analysis.genres;
      console.log('🔄 Using fallback genres:', genres);
    } else if (analysis.music && analysis.music.genres && analysis.music.genres.length > 0) {
      // Handle direct genres in music object
      genres = analysis.music.genres;
      energyLevel = analysis.music.energy_level || 'medium';
      searchTerms = analysis.music.search_terms || analysis.music.searchTerms || [];
      console.log('🎵 Using direct music genres:', genres);
      console.log('🎵 Using direct music energy level:', energyLevel);
      console.log('🎵 Using direct music search terms:', searchTerms);
    } else {
      console.log('⚠️ No genres found in analysis, using default fallback');
    }
    
    // Get mood from analysis
    if (analysis.mood && analysis.mood.primary) {
      mood = analysis.mood.primary;
    } else if (analysis.mood && typeof analysis.mood === 'string') {
      mood = analysis.mood;
    } else {
      console.log('⚠️ No mood found in analysis, using default');
    }
    
    console.log('🎭 Final mood:', mood);
    console.log('⚡ Final energy level:', energyLevel);
    console.log('🎵 Final genres:', genres);
    
    // Try to get real Spotify tracks using client credentials
    console.log('🔍 Attempting to get real Spotify tracks for preview...');
    let realTracks = [];
    
    try {
      // Check if Spotify credentials are available
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('⚠️ Spotify credentials not configured, skipping real track search');
        throw new Error('Spotify credentials not configured');
      }
      
      realTracks = await searchTracksWithClientCredentials(genres, 15, searchTerms);
      console.log(`✅ Found ${realTracks.length} real Spotify tracks for preview`);
    } catch (error) {
      console.log('⚠️ Failed to get real Spotify tracks, falling back to examples:', error.message);
    }
    
    // Convert real tracks to preview format or fall back to examples
    let virtualTracks = [];
    
    if (realTracks.length > 0) {
      // Use real Spotify tracks
      virtualTracks = realTracks.map((track, index) => ({
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        genre: genres[index % genres.length] || 'pop',
        id: track.id, // Keep the real Spotify track ID
        uri: track.uri, // Keep the real Spotify URI
        preview_url: track.preview_url,
        isPreview: true,
        spotify_url: track.external_urls?.spotify,
        external_urls: track.external_urls // Keep all external URLs
      }));
    } else {
      // Fall back to representative examples
      console.log('🔄 Using representative track examples');
      virtualTracks = generateRepresentativeTracks(genres, mood, energyLevel);
    }
    
    const preview = {
      name: playlistName || `${mood} Vibes`,
      description: `AI-generated playlist based on your Pinterest board`,
      trackCount: virtualTracks.length,
      tracks: virtualTracks,
      genres: genres,
      mood: mood,
      energyLevel: energyLevel,
      isPreview: true,
      message: 'Connect Spotify to create this actual playlist!',
      hasRealTracks: realTracks.length > 0
    };
    
    console.log('✅ Virtual playlist preview generated:', preview);
    return preview;
    
  } catch (error) {
    console.error('❌ Virtual playlist preview error:', error);
    // Return a basic fallback instead of throwing
    return {
      name: playlistName || 'Mood Vibes',
      description: 'AI-generated playlist based on your Pinterest board',
      trackCount: 5,
      tracks: generateRepresentativeTracks(['pop', 'indie'], 'chill', 'medium'),
      genres: ['pop', 'indie'],
      mood: 'chill',
      energyLevel: 'medium',
      isPreview: true,
      message: 'Connect Spotify to create this actual playlist!',
      hasRealTracks: false
    };
  }
}

// Generate representative track suggestions
function generateRepresentativeTracks(genres, mood, energyLevel) {
  const tracks = [];
  
  // Enhanced genre examples with more sophisticated mappings
  const genreExamples = {
    // Claude AI genres
    'Disco': ['Stayin\' Alive', 'Le Freak', 'I Will Survive', 'Dancing Queen', 'Boogie Wonderland'],
    'Funk': ['Super Freak', 'Give Up the Funk', 'Brick House', 'Get Up Offa That Thing', 'Flash Light'],
    'Dance-Punk': ['Take Me Out', 'Maps', 'Last Nite', 'Reptilia', 'The Modern Age'],
    
    // Chill/Lo-fi genres
    'Downtempo': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    'Trip Hop': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    'Chillwave': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    'Lo-Fi': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    'Chill': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    
    // Electronic genres
    'Electronic': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    'Ambient': ['Claire de Lune', 'Weightless', 'Spiegel im Spiegel', 'Teardrop', 'Glory Box'],
    'Synthwave': ['Teardrop', 'Glory Box', 'Protection', 'Unfinished Sympathy', 'Angel'],
    
    // Rock genres
    'Rock': ['Wonderwall', 'Sweet Child O\' Mine', 'Stairway to Heaven', 'Bohemian Rhapsody', 'Hotel California'],
    'Alternative': ['Float On', 'Such Great Heights', 'Skinny Love', 'Creep', 'Smells Like Teen Spirit'],
    'Indie Rock': ['Float On', 'Such Great Heights', 'Skinny Love', 'Creep', 'Smells Like Teen Spirit'],
    
    // Pop genres
    'Pop': ['Happy', 'Uptown Funk', 'Shake It Off', 'Blinding Lights', 'Dance Monkey'],
    'Indie Pop': ['Float On', 'Such Great Heights', 'Skinny Love', 'Creep', 'Smells Like Teen Spirit'],
    
    // Jazz/Classical
    'Jazz': ['Take Five', 'So What', 'What a Wonderful World', 'Fly Me to the Moon', 'The Girl from Ipanema'],
    'Classical': ['Claire de Lune', 'Weightless', 'Spiegel im Spiegel', 'Moonlight Sonata', 'Für Elise'],
    
    // Fallback genres
    'rockabilly': ['Johnny B. Goode', 'Blue Suede Shoes', 'Hound Dog'],
    'doo-wop': ['In the Still of the Night', 'Earth Angel', 'Why Do Fools Fall in Love'],
    'vintage pop': ['Dream Lover', 'Calendar Girl', 'Beyond the Sea'],
    'acoustic': ['Wonderwall', 'Fast Car', 'Hallelujah'],
    'folk': ['The Sound of Silence', 'Blowin\' in the Wind', 'This Land is Your Land'],
    'indie': ['Float On', 'Such Great Heights', 'Skinny Love'],
    'ambient': ['Claire de Lune', 'Weightless', 'Spiegel im Spiegel'],
    'jazz': ['Take Five', 'So What', 'What a Wonderful World'],
    'chill': ['Lofi Hip Hop', 'Peaceful Piano', 'Nature Sounds'],
    'pop': ['Happy', 'Uptown Funk', 'Shake It Off']
  };
  
  const artistExamples = {
    // Claude AI artists
    'Disco': ['Bee Gees', 'Chic', 'Gloria Gaynor', 'ABBA', 'Earth, Wind & Fire'],
    'Funk': ['Rick James', 'Parliament', 'Commodores', 'James Brown', 'Parliament-Funkadelic'],
    'Dance-Punk': ['Franz Ferdinand', 'Yeah Yeah Yeahs', 'The Strokes', 'The Strokes', 'The Strokes'],
    
    // Chill/Lo-fi artists
    'Downtempo': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    'Trip Hop': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    'Chillwave': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    'Lo-Fi': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    'Chill': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    
    // Electronic artists
    'Electronic': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    'Ambient': ['Debussy', 'Marconi Union', 'Arvo Pärt', 'Massive Attack', 'Portishead'],
    'Synthwave': ['Massive Attack', 'Portishead', 'Tricky', 'Morcheeba', 'Zero 7'],
    
    // Rock artists
    'Rock': ['Oasis', 'Guns N\' Roses', 'Led Zeppelin', 'Queen', 'Eagles'],
    'Alternative': ['Modest Mouse', 'The Postal Service', 'Bon Iver', 'Radiohead', 'Nirvana'],
    'Indie Rock': ['Modest Mouse', 'The Postal Service', 'Bon Iver', 'Radiohead', 'Nirvana'],
    
    // Pop artists
    'Pop': ['Pharrell Williams', 'Mark Ronson', 'Taylor Swift', 'The Weeknd', 'Tones and I'],
    'Indie Pop': ['Modest Mouse', 'The Postal Service', 'Bon Iver', 'Radiohead', 'Nirvana'],
    
    // Jazz/Classical artists
    'Jazz': ['Dave Brubeck', 'Miles Davis', 'Louis Armstrong', 'Frank Sinatra', 'Stan Getz'],
    'Classical': ['Debussy', 'Marconi Union', 'Arvo Pärt', 'Beethoven', 'Mozart'],
    
    // Fallback artists
    'rockabilly': ['Elvis Presley', 'Chuck Berry', 'Carl Perkins'],
    'doo-wop': ['The Platters', 'The Penguins', 'Frankie Lymon'],
    'vintage pop': ['Bobby Darin', 'Neil Sedaka', 'Frankie Valli'],
    'acoustic': ['Oasis', 'Tracy Chapman', 'Jeff Buckley'],
    'folk': ['Simon & Garfunkel', 'Bob Dylan', 'Woody Guthrie'],
    'indie': ['Modest Mouse', 'The Postal Service', 'Bon Iver'],
    'ambient': ['Debussy', 'Marconi Union', 'Arvo Pärt'],
    'jazz': ['Dave Brubeck', 'Miles Davis', 'Louis Armstrong'],
    'chill': ['Various Artists', 'Classical Piano', 'Nature'],
    'pop': ['Pharrell Williams', 'Mark Ronson', 'Taylor Swift']
  };
  
  console.log('🎵 Generating tracks for genres:', genres);
  console.log('🎭 Mood:', mood);
  console.log('⚡ Energy level:', energyLevel);
  
  // Generate 15-20 representative tracks
  for (let i = 0; i < 18; i++) {
    const genre = genres[i % genres.length] || 'pop';
    const trackIndex = Math.floor(i / genres.length);
    const trackName = genreExamples[genre]?.[trackIndex] || `${genre} track ${i + 1}`;
    const artistName = artistExamples[genre]?.[trackIndex] || `${genre} artist`;
    
    tracks.push({
      name: trackName,
      artist: artistName,
      genre: genre,
      id: `preview-${i}`,
      preview_url: null,
      isPreview: true
    });
  }
  
  console.log('✅ Generated', tracks.length, 'representative tracks');
  return tracks;
}

// ===== AI ANALYSIS CACHE STATISTICS =====

app.get('/api/ai/cache-stats', (req, res) => {
  try {
    const cacheStats = aiAnalyzer.getCacheStatistics();
    res.json({
      success: true,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

// Start server for Render
app.listen(PORT, () => {
  console.log(`🚀 MoodSync Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎵 Spotify configured: ${!!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)}`);
  console.log(`📌 Pinterest configured: ${!!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET)}`);
});

// Enhanced analysis with Vision API for URL-based analysis
app.post('/api/analyze-pinterest-enhanced', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || (!url.includes('pinterest.com') && !url.includes('pin.it/'))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Pinterest board URL or shortlink'
      });
    }
    console.log('📡 Received analyze-pinterest-enhanced request:', { url });
    const analysis = await generateEnhancedAnalysisWithVision(url);
    res.json({
      success: true,
      analysis,
      method: analysis.analysis_method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Enhanced analysis failed. Please try again.',
      error: error.message
    });
  }
});

// Utility: Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Utility: Extract up to 5 unique image URLs from a Pinterest board URL
async function extractImagesFromBoardUrl(boardUrl) {
  try {
    console.log('🔍 Extracting images from board URL:', boardUrl);
    const response = await axios.get(boardUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    const html = response.data;
    const imageRegex = /https:\/\/i\.pinimg\.com\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi;
    const matches = html.match(imageRegex) || [];
    const uniqueImages = [...new Set(matches)].slice(0, 5);
    console.log(`📸 Found ${uniqueImages.length} images from board URL`);
    return uniqueImages;
  } catch (error) {
    console.error('❌ Error extracting images from board URL:', error.message);
    return [];
  }
}

// Create playlist preview endpoint
app.post('/api/create-playlist', async (req, res) => {
  try {
    const { analysis, playlistName, accessToken } = req.body;
    if (!analysis) {
      return res.status(400).json({
        success: false,
        message: 'Analysis data is required'
      });
    }
    console.log('🎵 Creating playlist preview...');
    console.log('📊 Analysis data:', analysis);
    console.log('📝 Playlist name:', playlistName);
    console.log('🔑 Access token present:', !!accessToken);
    // Generate virtual playlist preview
    const preview = await generateVirtualPlaylistPreview(analysis, playlistName);
    res.json({
      success: true,
      playlist: preview,
      message: preview.message || 'Playlist preview generated successfully'
    });
  } catch (error) {
    console.error('❌ Playlist creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create playlist preview',
      error: error.message
    });
  }
});
