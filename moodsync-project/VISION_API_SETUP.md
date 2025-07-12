# Google Cloud Vision API Setup for MoodSync

This guide will help you set up Google Cloud Vision API to enhance MoodSync's mood detection with visual analysis of Pinterest pins.

## 🎯 What Vision API Adds

- **Color Analysis**: Detects dominant colors and color palettes
- **Object Recognition**: Identifies objects, scenes, and content
- **Face Detection**: Counts people in images
- **Mood Mapping**: Converts visual elements to musical moods
- **Enhanced Accuracy**: Combines visual + text analysis for better results

## 📋 Prerequisites

1. **Google Cloud Account** (free tier available)
2. **Credit Card** (for billing, but free tier covers most usage)
3. **Node.js Backend** (already set up)

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "moodsync-vision-api"
4. Click "Create"

### 2. Enable Vision API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Cloud Vision API"
3. Click on it and press "Enable"

### 3. Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated key
4. Click "Restrict Key" and add these restrictions:
   - **API restrictions**: Select "Cloud Vision API"
   - **Application restrictions**: "HTTP referrers" (optional)

### 4. Set Environment Variable

Add the API key to your backend environment:

```bash
# In your backend directory
echo "GOOGLE_VISION_API_KEY=your_api_key_here" >> .env
```

Or add it to your deployment platform (Render, Heroku, etc.):

**For Render:**
1. Go to your service dashboard
2. Click "Environment"
3. Add variable: `GOOGLE_VISION_API_KEY` = `your_api_key_here`

### 5. Test the Integration

The Vision API is now integrated! When you analyze a Pinterest board:

1. **Text Analysis**: Analyzes board name, descriptions, pin titles
2. **Visual Analysis**: Analyzes up to 8 pin images
3. **Combined Results**: Merges both analyses for better accuracy

## 💰 Cost Analysis

### Google Cloud Vision API Pricing
- **Label Detection**: $1.50 per 1,000 images
- **Image Properties**: $1.50 per 1,000 images
- **Face Detection**: $1.50 per 1,000 images
- **Safe Search**: $1.50 per 1,000 images

### Typical Usage
- **Per board analysis**: 8 images × 4 features = 32 API calls
- **Cost per board**: ~$0.05
- **Monthly cost** (100 boards): ~$5

### Free Tier
- **1,000 images per month** for each feature
- **Total**: 4,000 free API calls per month
- **Equivalent to**: ~125 board analyses per month

## 🔧 Configuration Options

### Limit Image Analysis
```javascript
// In vision-analyzer.js
const MAX_IMAGES = 8; // Reduce for cost savings
const MAX_IMAGES = 4; // More conservative
```

### Enable/Disable Features
```javascript
// In vision-analyzer.js
const features = [
  { type: 'LABEL_DETECTION', maxResults: 10 },     // Object recognition
  { type: 'IMAGE_PROPERTIES', maxResults: 1 },     // Color analysis
  { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }, // Content safety
  { type: 'FACE_DETECTION', maxResults: 10 }       // Face counting
];
```

## 🎨 Visual Mood Mapping

The system maps visual elements to musical moods:

| Visual Element | Detected Mood | Music Genres |
|----------------|---------------|--------------|
| Bright Colors | Energetic, Joyful | Pop, Dance, Electronic |
| Warm Colors | Romantic, Passionate | Soul, R&B, Romantic |
| Cool Colors | Calm, Peaceful | Ambient, Chill, Lo-fi |
| Dark Colors | Melancholic, Mysterious | Indie, Alternative, Dream Pop |
| Nature Scenes | Peaceful, Grounded | Folk, Acoustic, Nature Sounds |
| Urban Scenes | Energetic, Modern | Hip Hop, Pop, Electronic |
| People/Social | Joyful, Connected | Pop, Indie Pop, Feel-good |
| Abstract Art | Creative, Inspired | Experimental, Indie, Alternative |

## 🔍 Troubleshooting

### Common Issues

**1. "API key not configured"**
- Check environment variable is set correctly
- Restart your backend server

**2. "Vision API error"**
- Verify API is enabled in Google Cloud Console
- Check API key restrictions
- Ensure billing is set up

**3. "No analysis results"**
- Check image URLs are accessible
- Verify images are valid formats (JPEG, PNG, etc.)
- Check image size (max 10MB)

### Debug Mode
```javascript
// Add to vision-analyzer.js for debugging
console.log('Vision API request:', requestBody);
console.log('Vision API response:', response.data);
```

## 📊 Performance Monitoring

### Track Usage
```javascript
// Add to your analysis endpoint
console.log(`Vision API calls: ${imageUrls.length} images`);
console.log(`Analysis cost: ~$${(imageUrls.length * 0.006).toFixed(3)}`);
```

### Monitor Limits
- Set up Google Cloud billing alerts
- Monitor API usage in Google Cloud Console
- Set daily/monthly spending limits

## 🚀 Next Steps

1. **Deploy the changes** to your backend
2. **Test with a Pinterest board** that has good images
3. **Monitor the analysis results** in your app
4. **Adjust image limits** based on cost preferences

## 💡 Advanced Features

### Custom Mood Mapping
```javascript
// Add custom visual-to-mood mappings
const CUSTOM_MOOD_MAPPING = {
  'minimalist': { mood: 'calm', genres: ['ambient', 'minimal'] },
  'vintage': { mood: 'nostalgic', genres: ['retro', 'classic'] },
  'bold': { mood: 'confident', genres: ['rock', 'pop'] }
};
```

### Batch Processing
```javascript
// Process multiple boards efficiently
const batchAnalysis = async (boards) => {
  const results = await Promise.all(
    boards.map(board => analyzeBoard(board))
  );
  return aggregateResults(results);
};
```

The Vision API integration will significantly improve your mood detection accuracy by analyzing the actual visual content of Pinterest pins! 