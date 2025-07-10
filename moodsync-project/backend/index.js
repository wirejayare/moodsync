// ENHANCED MOOD DETECTION SYSTEM WITH NLP

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

    console.log('Received Pinterest authorization code:', code);

    // Try v5 endpoint first
    let tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.PINTEREST_REDIRECT_URI
      })
    });

    console.log('v5 Token response status:', tokenResponse.status);
    let tokenData = await tokenResponse.text();
    console.log('v5 Token response data:', tokenData);

    // If v5 fails, try v1 endpoint
    if (!tokenResponse.ok) {
      console.log('v5 failed, trying v1 endpoint...');
      tokenResponse = await fetch('https://api.pinterest.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.PINTEREST_REDIRECT_URI,
          client_id: process.env.PINTEREST_CLIENT_ID,
          client_secret: process.env.PINTEREST_CLIENT_SECRET
        })
      });

      console.log('v1 Token response status:', tokenResponse.status);
      tokenData = await tokenResponse.text();
      console.log('v1 Token response data:', tokenData);
    }

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', tokenData);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to exchange code for token',
        error: tokenData
      });
    }

    let tokenJson;
    try {
      tokenJson = JSON.parse(tokenData);
    } catch (e) {
      console.error('Failed to parse token response:', e);
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid token response format',
        error: tokenData
      });
    }

    const accessToken = tokenJson.access_token;
    console.log('Access token obtained:', accessToken ? 'YES' : 'NO');

    if (!accessToken) {
      console.error('No access token in response:', tokenJson);
      return res.status(400).json({ 
        success: false, 
        message: 'No access token received',
        error: tokenJson
      });
    }

    // Try v5 user endpoint first, then v1 as fallback
    let userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('v5 User info response status:', userResponse.status);
    let userData = await userResponse.text();
    console.log('v5 User info response data:', userData);

    // If v5 fails, try v1 endpoint
    if (!userResponse.ok) {
      console.log('v5 user endpoint failed, trying v1...');
      userResponse = await fetch('https://api.pinterest.com/v1/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('v1 User info response status:', userResponse.status);
      userData = await userResponse.text();
      console.log('v1 User info response data:', userData);
    }

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userData);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to get user info',
        error: userData
      });
    }

    let userJson;
    try {
      userJson = JSON.parse(userData);
    } catch (e) {
      console.error('Failed to parse user response:', e);
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid user response format',
        error: userData
      });
    }

    // Try to get boards (this might fail for trial access)
    let boardsJson = { items: [] };
    try {
      const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Boards response status:', boardsResponse.status);
      const boardsData = await boardsResponse.text();
      console.log('Boards response data:', boardsData);

      if (boardsResponse.ok) {
        try {
          boardsJson = JSON.parse(boardsData);
        } catch (e) {
          console.error('Failed to parse boards response:', e);
        }
      } else {
        console.error('Failed to get boards:', boardsData);
      }
    } catch (boardsError) {
      console.error('Boards request failed:', boardsError.message);
    }

    res.json({
      success: true,
      message: 'Successfully authenticated with Pinterest',
      user: userJson,
      boards: boardsJson.items || [],
      access_token: accessToken,
      note: 'Trial access apps may have limited API access'
    });

  } catch (error) {
    console.error('Pinterest OAuth error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to authenticate with Pinterest',
      error: error.message 
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
  console.error('❌ Unhandled error:', error);
  console.error('❌ Error stack:', error.stack);
  console.error('❌ Request URL:', req.url);
  console.error('❌ Request method:', req.method);
  console.error('❌ Request body:', req.body);
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

// Pinterest API test endpoint
app.get('/api/pinterest/test-api', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      app_status: 'Trial Access',
      endpoints_to_test: [
        'https://api.pinterest.com/v5/oauth/token',
        'https://api.pinterest.com/v5/user_account',
        'https://api.pinterest.com/v5/boards',
        'https://api.pinterest.com/oauth/token',
        'https://api.pinterest.com/v1/user',
        'https://api.pinterest.com/v1/me'
      ],
      recommendations: [
        'Trial access apps may have limited API access',
        'Try using v1 endpoints instead of v5',
        'Check if app needs additional permissions',
        'Consider requesting full access from Pinterest'
      ]
    };

    // Test basic OAuth flow with v1 endpoints
    const testAuthUrl = `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&response_type=code&scope=boards:read,pins:read,user_accounts:read`;
    
    testResults.auth_url = testAuthUrl;
    testResults.client_id = process.env.PINTEREST_CLIENT_ID;
    testResults.redirect_uri = process.env.PINTEREST_REDIRECT_URI;

    res.json(testResults);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test Pinterest API',
      error: error.message 
    });
  }
});
