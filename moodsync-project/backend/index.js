// ENHANCED MOOD DETECTION SYSTEM WITH NLP AND VISION ANALYSIS
// const visionAnalyzer = require('./vision-analyzer');
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
      const params = { page_size: 25 };
      if (bookmark) params.bookmark = bookmark;
      const response = await axios.get('https://api.pinterest.com/v5/boards', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: params
      });
      const boards = response.data.items || [];
      allBoards.push(...boards);
      bookmark = response.data.bookmark;
      hasMore = !!bookmark;
      console.log(`Fetched ${boards.length} boards (total: ${allBoards.length})`);
      if (allBoards.length > 500) break;
    }
    console.log(`Total boards found: ${allBoards.length}`);
    // Only return board metadata, no pins/thumbnails
    return allBoards.map(board => ({
      id: board.id,
      name: board.name,
      description: board.description || '',
      pin_count: board.pin_count || 0,
      follower_count: board.follower_count || 0,
      url: `https://pinterest.com/${board.owner?.username || 'user'}/${board.name?.replace(/\s+/g, '-').toLowerCase() || board.id}/`,
      image_thumbnail_url: board.media?.image_cover_url,
      privacy: board.privacy || 'public',
      created_at: board.created_at,
      owner: {
        username: board.owner?.username || 'unknown',
        first_name: board.owner?.first_name || '',
        last_name: board.owner?.last_name || ''
      }
    }));
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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
async function analyzePinterestBoard(url) {
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====



// Search tracks using client credentials (for previews)
async function searchTracksWithClientCredentials(genres, limit = 15, searchTerms = []) {
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====



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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====



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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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

async function generateEnhancedAnalysis(url) {
  console.log('🔍 Starting enhanced analysis for:', url);
  
  const boardInfo = await extractBoardInfo(url);
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

// ===== SPOTIFY CLIENT CREDENTIALS =====


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
  try {
    // Check if Spotify credentials are available
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('⚠️ Spotify credentials not configured, skipping client credentials search');
      return [];
    }
    
    const accessToken = await getClientCredentialsToken();
    console.log('🎵 Searching tracks with client credentials for genres:', genres);
    
    const tracks = [];
    
    // Enhanced search strategy with much more variety
    for (const genre of genres) {
      if (tracks.length >= limit) break;
      
      // Generate multiple search strategies with randomization
      const searchStrategies = [
        // Strategy 1: Direct genre search with different offsets
        `genre:${genre}`,
        // Strategy 2: Genre as keyword
        genre,
        // Strategy 3: Genre with mood keywords
        `${genre} ${getRandomMood()}`,
        `${genre} ${getRandomMood()}`,
        // Strategy 4: Genre with year ranges
        `${genre} year:${getRandomYearRange()}`,
        `${genre} year:${getRandomYearRange()}`,
        // Strategy 5: Genre with popularity filters
        `${genre} popularity:${getRandomPopularityRange()}`,
        // Strategy 6: Genre with tempo filters
        `${genre} tempo:${getRandomTempoRange()}`,
        // Strategy 7: Genre with energy levels
        `${genre} ${getRandomEnergyLevel()}`,
        // Strategy 8: Common artists in the genre
        getGenreArtists(genre),
        // Strategy 9: Genre with acousticness
        `${genre} acousticness:${getRandomAcousticness()}`,
        // Strategy 10: Genre with danceability
        `${genre} danceability:${getRandomDanceability()}`
      ].filter(Boolean); // Remove empty strategies
      
      console.log(`🔍 Trying ${searchStrategies.length} search strategies for genre: "${genre}"`);
      
      for (const searchQuery of searchStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching: "${searchQuery}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: searchQuery,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Get fewer tracks per search for more variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for: "${searchQuery}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for "${searchQuery}":`, error.message);
        }
      }
    }
    
    // If still no results, try search terms
    if (tracks.length === 0 && searchTerms.length > 0) {
      console.log('🔄 No genre results, trying search terms...');
      for (const term of searchTerms) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔍 Searching for term: "${term}"`);
          
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: term,
              type: 'track',
              limit: Math.min(limit, limit - tracks.length),
              market: 'US'
            }
          });
          
          if (response.data.tracks && response.data.tracks.items && response.data.tracks.items.length > 0) {
            console.log(`✅ Found ${response.data.tracks.items.length} tracks for term: "${term}"`);
            tracks.push(...response.data.tracks.items);
          }
        } catch (error) {
          console.error(`❌ Search failed for term "${term}":`, error.message);
        }
      }
    }
    
    // Remove duplicates
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Found ${shuffledTracks.length} unique tracks with client credentials`);
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Client credentials track search error:', error);
    return [];
  }
}

// Helper functions for generating random search parameters
function getRandomMood() {
  const moods = ['chill', 'energetic', 'relaxing', 'upbeat', 'mellow', 'vibrant', 'smooth', 'dynamic', 'happy', 'calm', 'peaceful', 'dreamy', 'romantic', 'nostalgic', 'uplifting', 'melancholic', 'passionate', 'serene', 'lively', 'tranquil'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getRandomYearRange() {
  const startYear = Math.floor(Math.random() * 30) + 1970;
  const endYear = startYear + Math.floor(Math.random() * 20) + 10;
  return `${startYear}-${Math.min(endYear, 2024)}`;
}

function getRandomPopularityRange() {
  const min = Math.floor(Math.random() * 40);
  const max = min + Math.floor(Math.random() * 40) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomTempoRange() {
  const min = Math.floor(Math.random() * 80) + 60;
  const max = min + Math.floor(Math.random() * 60) + 40;
  return `${min}-${Math.min(max, 200)}`;
}

function getRandomEnergyLevel() {
  const levels = ['low', 'medium', 'high', 'energetic', 'calm', 'relaxed', 'upbeat', 'mellow'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomAcousticness() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

function getRandomDanceability() {
  const min = Math.floor(Math.random() * 50);
  const max = min + Math.floor(Math.random() * 50) + 20;
  return `${min}-${Math.min(max, 100)}`;
}

// Helper function to get representative artists for genres
function getGenreArtists(genre) {
  const genreArtists = {
    'Dream Pop': 'Cocteau Twins, Mazzy Star, Beach House',
    'Shoegaze': 'My Bloody Valentine, Slowdive, Ride',
    'Indie Rock': 'Modest Mouse, The Strokes, Arctic Monkeys',
    'Indie Pop': 'The Postal Service, Bon Iver, Vampire Weekend',
    'Alternative': 'Radiohead, The Killers, Arcade Fire',
    'Electronic': 'Daft Punk, The Chemical Brothers, Aphex Twin',
    'Ambient': 'Brian Eno, Tycho, Marconi Union',
    'Downtempo': 'Massive Attack, Portishead, Tricky',
    'Trip Hop': 'Massive Attack, Portishead, Morcheeba',
    'Chillwave': 'Washed Out, Toro y Moi, Neon Indian',
    'Lo-Fi': 'Nujabes, J Dilla, Madlib',
    'Chill': 'Tycho, Bonobo, Emancipator',
    'Disco': 'Bee Gees, Chic, Donna Summer',
    'Funk': 'James Brown, Parliament, Rick James',
    'Dance-Punk': 'Franz Ferdinand, The Rapture, LCD Soundsystem',
    'Pop': 'Taylor Swift, The Weeknd, Dua Lipa',
    'Rock': 'Led Zeppelin, Queen, The Rolling Stones',
    'Jazz': 'Miles Davis, John Coltrane, Dave Brubeck',
    'Classical': 'Beethoven, Mozart, Bach'
  };
  
  return genreArtists[genre] || null;
}

// ===== SPOTIFY FUNCTIONS =====

async function searchTracksForMood(accessToken, genres, limit = 20, searchTerms = []) {
  const tracks = [];
  
  try {
    console.log('🎵 Starting enhanced track search with genres:', genres);
    console.log('🎯 Board title keywords (search terms):', searchTerms);
    
    // Ensure genres is an array and has valid values
    if (!Array.isArray(genres) || genres.length === 0) {
      console.log('⚠️ No valid genres provided, using fallback genres');
      genres = ['pop', 'indie'];
    }
    
    // Clean and validate genres
    const validGenres = genres
      .filter(genre => genre && typeof genre === 'string' && genre.trim().length > 0)
      .map(genre => genre.trim().toLowerCase())
      .slice(0, 5); // Limit to 5 genres max
    
    if (validGenres.length === 0) {
      console.log('⚠️ No valid genres after filtering, using fallback');
      validGenres.push('pop', 'indie');
    }
    
    // Clean and validate search terms (board title keywords)
    const validSearchTerms = searchTerms
      .filter(term => term && typeof term === 'string' && term.trim().length > 0)
      .map(term => term.trim().toLowerCase())
      .slice(0, 3); // Limit to 3 primary keywords
    
    console.log('🎵 Using valid genres:', validGenres);
    console.log('🎯 Using board title keywords:', validSearchTerms);
    
    // 🎯 PRIORITY 1: Search with board title keywords first (but limit results)
    const maxKeywordTracks = Math.floor(limit * 0.4); // Only 40% from keywords
    if (validSearchTerms.length > 0) {
      for (const keyword of validSearchTerms) {
        if (tracks.length >= maxKeywordTracks) break; // Stop keyword search early
        
        try {
          console.log(`🎯 Searching with board title keyword: "${keyword}"`);
          
          const keywordStrategies = [
            // Strategy 1: Keyword + random mood
            `${keyword} ${getRandomMood()}`,
            // Strategy 2: Keyword with genre context
            `${keyword} ${validGenres[0] || 'music'}`,
            // Strategy 3: Keyword with year range
            `${keyword} year:${getRandomYearRange()}`,
            // Strategy 4: Keyword with popularity filter
            `${keyword} popularity:${getRandomPopularityRange()}`,
            // Strategy 5: Keyword with tempo filter
            `${keyword} tempo:${getRandomTempoRange()}`,
            // Strategy 6: Keyword with energy level
            `${keyword} ${getRandomEnergyLevel()}`
          ];
          
          for (const strategy of keywordStrategies) {
            if (tracks.length >= maxKeywordTracks) break;
            
            try {
              console.log(`🎯 Trying keyword strategy: "${strategy}"`);
              
              const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                  q: strategy,
                  type: 'track',
                  limit: Math.min(3, maxKeywordTracks - tracks.length), // Smaller batches for variety
                  market: 'US',
                  offset: Math.floor(Math.random() * 50) // Random offset for variety
                }
              });
              
              if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
                console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for keyword strategy: "${strategy}"`);
                tracks.push(...searchResponse.data.tracks.items);
              } else {
                console.log(`❌ No tracks found for keyword strategy: "${strategy}"`);
              }
            } catch (strategyError) {
              console.error(`❌ Keyword search strategy failed: "${strategy}"`, strategyError.message);
            }
          }
        } catch (keywordError) {
          console.error(`❌ Search failed for keyword ${keyword}:`, keywordError.message);
        }
      }
    }
    
    // 🎵 PRIORITY 2: Search with genres using enhanced variety
    for (const genre of validGenres) {
      if (tracks.length >= limit) break;
      
      try {
        console.log(`🎵 Searching for genre: ${genre}`);
        
        // Use the same enhanced search strategies as client credentials
        const searchStrategies = [
          // Strategy 1: Direct genre search with different offsets
          `genre:${genre}`,
          // Strategy 2: Genre as keyword
          genre,
          // Strategy 3: Genre with mood keywords
          `${genre} ${getRandomMood()}`,
          `${genre} ${getRandomMood()}`,
          // Strategy 4: Genre with year ranges
          `${genre} year:${getRandomYearRange()}`,
          `${genre} year:${getRandomYearRange()}`,
          // Strategy 5: Genre with popularity filters
          `${genre} popularity:${getRandomPopularityRange()}`,
          // Strategy 6: Genre with tempo filters
          `${genre} tempo:${getRandomTempoRange()}`,
          // Strategy 7: Genre with energy levels
          `${genre} ${getRandomEnergyLevel()}`,
          // Strategy 8: Common artists in the genre
          getGenreArtists(genre),
          // Strategy 9: Genre with acousticness
          `${genre} acousticness:${getRandomAcousticness()}`,
          // Strategy 10: Genre with danceability
          `${genre} danceability:${getRandomDanceability()}`
        ].filter(Boolean); // Remove empty strategies
        
        for (const searchQuery of searchStrategies) {
          if (tracks.length >= limit) break;
          
          try {
            console.log(`🎵 Trying search strategy: "${searchQuery}"`);
            
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              params: {
                q: searchQuery,
                type: 'track',
                limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
                market: 'US',
                offset: Math.floor(Math.random() * 50) // Random offset for variety
              }
            });
            
            if (searchResponse.data.tracks && searchResponse.data.tracks.items && searchResponse.data.tracks.items.length > 0) {
              console.log(`✅ Found ${searchResponse.data.tracks.items.length} tracks for strategy: "${searchQuery}"`);
              tracks.push(...searchResponse.data.tracks.items);
            } else {
              console.log(`❌ No tracks found for strategy: "${searchQuery}"`);
            }
          } catch (strategyError) {
            console.error(`❌ Search strategy failed: "${strategy}"`, strategyError.message);
          }
        }
      } catch (genreError) {
        console.error(`❌ Search failed for genre ${genre}:`, genreError.message);
      }
    }
    
    // Enhanced fallback searches if no results
    if (tracks.length === 0) {
      console.log('🔄 No tracks found, trying enhanced fallback searches...');
      
      const fallbackStrategies = [
        // Enhanced fallback with variety
        `${getRandomMood()} music`,
        `popularity:${getRandomPopularityRange()}`,
        `year:${getRandomYearRange()}`,
        `tempo:${getRandomTempoRange()}`,
        `${getRandomEnergyLevel()} music`,
        'chill',
        'relaxing',
        'upbeat',
        'indie',
        'pop'
      ];
      
      for (const fallback of fallbackStrategies) {
        if (tracks.length >= limit) break;
        
        try {
          console.log(`🔄 Trying enhanced fallback search: "${fallback}"`);
          
          const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
              q: fallback,
              type: 'track',
              limit: Math.min(3, limit - tracks.length), // Smaller batches for variety
              market: 'US',
              offset: Math.floor(Math.random() * 50) // Random offset for variety
            }
          });
          
          if (fallbackResponse.data.tracks && fallbackResponse.data.tracks.items && fallbackResponse.data.tracks.items.length > 0) {
            console.log(`✅ Found ${fallbackResponse.data.tracks.items.length} tracks with enhanced fallback: "${fallback}"`);
            tracks.push(...fallbackResponse.data.tracks.items);
          }
        } catch (fallbackError) {
          console.error(`❌ Enhanced fallback search failed: "${fallback}"`, fallbackError.message);
        }
      }
    }
    
    console.log(`🎵 Total tracks found: ${tracks.length}`);
    
    // Remove duplicates and shuffle for variety
    const uniqueTracks = [];
    const seenTrackIds = new Set();
    
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        uniqueTracks.push(track);
        seenTrackIds.add(track.id);
      }
    }
    
    // Shuffle the tracks for more variety
    const shuffledTracks = shuffleArray([...uniqueTracks]);
    
    console.log(`🎵 Unique tracks after deduplication: ${shuffledTracks.length}`);
    
    return shuffledTracks.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Track search error:', error);
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

// ===== PINTEREST SHORTLINK EXPANSION =====

// Detect if URL is a Pinterest shortlink
function isPinterestShortlink(url) {
  return url.includes('pin.it/') || url.includes('pinterest.com/pin/');
}

// Expand Pinterest shortlink to full URL
async function expandPinterestShortlink(shortlink) {
  try {
    console.log('🔗 Expanding Pinterest shortlink:', shortlink);
    
    // Make a GET request to get the redirect location (HEAD requests might be blocked)
    const response = await axios.get(shortlink, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    let expandedUrl = response.request.res.responseUrl || response.request.res.responseHeaders?.location || shortlink;
    console.log('✅ Expanded shortlink to:', expandedUrl);
    console.log('🔍 Response headers:', response.request.res.responseHeaders);
    console.log('🔍 Response URL:', response.request.res.responseUrl);
    
    // If the URL didn't change, try a different approach
    if (expandedUrl === shortlink) {
      console.log('⚠️ URL didn\'t expand, trying alternative method...');
      // Try to extract the redirect from response headers
      const locationHeader = response.headers?.location || response.request.res.responseHeaders?.location;
      if (locationHeader) {
        expandedUrl = locationHeader;
        console.log('✅ Found redirect in headers:', expandedUrl);
      }
    }
    
    // Check if the expanded URL is a board URL or pin URL
    if (expandedUrl.includes('/pin/')) {
      console.log('⚠️ Shortlink expanded to a pin URL, not a board URL');
      throw new Error('This shortlink points to a Pinterest pin, not a board. Please use a board shortlink instead.');
    }
    
    return expandedUrl;
  } catch (error) {
    console.error('❌ Failed to expand shortlink:', error.message);
    if (error.message.includes('pin URL')) {
      throw error; // Re-throw pin URL errors
    }
    return shortlink; // Return original if expansion fails
  }
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