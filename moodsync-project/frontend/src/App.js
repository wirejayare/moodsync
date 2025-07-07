import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isCallback, setIsCallback] = useState(false);
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    // Check if this is a callback from Spotify
    if (window.location.pathname === '/callback') {
      setIsCallback(true);
      handleSpotifyCallback();
      return;
    }

    // Normal health check
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Connected');
      })
      .catch(() => setBackendStatus('❌ Not connected'));
  }, []);

  const handleSpotifyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      alert('Spotify authorization failed: ' + error);
      window.location.href = '/';
      return;
    }

    if (code) {
      alert('Spotify connected successfully! Code: ' + code.substring(0, 10) + '...');
      window.location.href = '/';
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/spotify/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const analyzePinterestBoard = async () => {
    if (!pinterestUrl) {
      alert('Please enter a Pinterest board URL');
      return;
    }

    if (!pinterestUrl.includes('pinterest.com')) {
      alert('Please enter a valid Pinterest URL');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analyze-pinterest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pinterestUrl })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        alert('Analysis failed: ' + data.message);
      }
    } catch (error) {
      alert('Error analyzing board: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show callback page
  if (isCallback) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <div>
          <h1>🔄 Processing Spotify Authorization...</h1>
          <p>Please wait while we connect your account.</p>
        </div>
      </div>
    );
  }

  // Show normal app
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🎨 MoodSync
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Transform Pinterest moodboards into Spotify playlists
          </p>
        </div>

        {/* Status Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3>System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>Frontend:</strong> ✅ Running</p>
        </div>

        {/* Pinterest Analysis Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '20px' }}>📌 Analyze Pinterest Board</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="url"
              value={pinterestUrl}
              onChange={(e) => setPinterestUrl(e.target.value)}
              placeholder="https://pinterest.com/username/board-name"
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '16px',
                marginBottom: '15px'
              }}
            />
          </div>

          <button 
            onClick={analyzePinterestBoard}
            disabled={isAnalyzing}
            style={{
              background: isAnalyzing ? '#ccc' : '#e60023',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🎨 Analyze Moodboard'}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '15px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3>🎭 Analysis Results</h3>
            <div style={{ marginTop: '20px' }}>
              <h4>Colors Found:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {analysisResult.colors?.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      borderRadius: '50%',
                      border: '3px solid white',
                      title: color
                    }}
                  />
                ))}
              </div>
              
              {analysisResult.mood && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Detected Mood:</h4>
                  <p style={{ fontSize: '18px', margin: '10px 0' }}>
                    {analysisResult.mood}
                  </p>
                </div>
              )}

              {analysisResult.description && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Description:</h4>
                  <p style={{ margin: '10px 0' }}>
                    {analysisResult.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spotify Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '20px' }}>🎵 Spotify Integration</h3>
          
          <button 
            onClick={handleSpotifyAuth}
            style={{
              background: '#1db954',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎵 Connect Spotify
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
