// src/components/SpotifyCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SpotifyCallback = ({ onSpotifyAuth }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          alert('Spotify authorization failed: ' + error);
          navigate('/');
          return;
        }

        if (code) {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/spotify/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const data = await response.json();
          
          if (data.success) {
            onSpotifyAuth(data.access_token, data.user);
            alert(`Welcome ${data.user.display_name}! Spotify connected.`);
          } else {
            alert('Failed to connect: ' + data.message);
          }
        }
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        setIsProcessing(false);
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, onSpotifyAuth]);

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
};

export default SpotifyCallback;