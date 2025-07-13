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
          const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/spotify/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const data = await response.json();
          
          if (data.success) {
            onSpotifyAuth(data.access_token, data.user);
            
            // Check if there's pending analysis to create a playlist
            const pendingAnalysis = localStorage.getItem('moodsync_pending_analysis');
            const pendingPlaylistName = localStorage.getItem('moodsync_pending_playlist_name');
            
            if (pendingAnalysis && pendingPlaylistName) {
              try {
                // Create the actual playlist in Spotify
                const createResponse = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/create-playlist`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    accessToken: data.access_token,
                    analysis: JSON.parse(pendingAnalysis),
                    playlistName: pendingPlaylistName
                  })
                });

                const createData = await createResponse.json();
                
                if (createData.success) {
                  // Clear the pending data
                  localStorage.removeItem('moodsync_pending_analysis');
                  localStorage.removeItem('moodsync_pending_playlist_name');
                  
                  // Store the created playlist data to show on return
                  localStorage.setItem('moodsync_created_playlist', JSON.stringify(createData.playlist));
                  localStorage.setItem('moodsync_analysis', pendingAnalysis);
                  
                  // Navigate back to home with success message
                  alert(`🎉 Welcome ${data.user.display_name}! Your playlist "${createData.playlist.name}" has been created in Spotify!`);
                } else {
                  alert('Spotify connected! However, there was an issue creating your playlist. You can try creating it again from the home page.');
                }
              } catch (error) {
                console.error('Error creating playlist after OAuth:', error);
                alert('Spotify connected! However, there was an issue creating your playlist. You can try creating it again from the home page.');
              }
            } else {
              alert(`Welcome ${data.user.display_name}! Spotify connected successfully.`);
            }
          } else {
            // Only show error if it's actually a failure
            alert('Failed to connect: ' + data.message);
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
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
      background: 'var(--background-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-text)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 3s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 3s ease-in-out infinite',
          animationDelay: '1s'
        }}></div>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '500px',
        padding: 'var(--space-xl)'
      }}>
        <div className="card glass-strong animate-fade-in-up">
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: '2rem' }}>🎵</span>
          </div>
          
          <h1 className="heading-2" style={{ marginBottom: 'var(--space-md)' }}>
            Processing Spotify Authorization...
          </h1>
          
          <p className="body-medium" style={{ 
            marginBottom: 'var(--space-xl)',
            color: 'var(--text-secondary)'
          }}>
            Please wait while we connect your account and create your playlist.
          </p>
          
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(34, 197, 94, 0.3)',
            borderTop: '4px solid #1db954',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default SpotifyCallback;
