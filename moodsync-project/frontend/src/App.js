import React, { useState } from 'react';

function App() {
  const [message, setMessage] = useState('Hello from MoodSync!');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
          🎨 MoodSync
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Transform Pinterest moodboards into Spotify playlists
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '2rem'
        }}>
          <p>{message}</p>
          <button 
            onClick={() => setMessage('App is working perfectly!')}
            style={{
              background: '#1db954',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            Test Button
          </button>
        </div>
        <p style={{ opacity: 0.7 }}>
          🚧 Building your amazing app...
        </p>
      </div>
    </div>
  );
}

export default App;
