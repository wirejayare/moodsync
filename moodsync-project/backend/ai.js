// ai.js
const axios = require('axios');

// Helper to build the Claude Vision prompt
function buildVisionPrompt(boardInfo) {
  return `You are a music curation AI. Analyze the Pinterest board info below and the attached images. Generate a playlist reasoning array (3-5 cool, conversational lines) and suggest genres, energy, and mood based on the board's vibe and visuals. Board info: ${JSON.stringify(boardInfo)}`;
}

// Main AI/Claude recommendation function
async function generateClaudeRecommendations(imageUrls, boardInfo, anthropicKey) {
  try {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildVisionPrompt(boardInfo) },
          ...imageUrls.slice(0, 5).map(url => ({ type: 'image_url', url }))
        ]
      }
    ];
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      messages
    }, {
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });
    // You may want to parse/validate the response here
    return response.data;
  } catch (error) {
    console.error('Claude Vision API error:', error.response?.data || error.message);
    throw new Error('Failed to get Claude Vision recommendations');
  }
}

module.exports = {
  generateClaudeRecommendations
}; 