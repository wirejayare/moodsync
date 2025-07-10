import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PinterestCallback = ({ onPinterestAuth }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          alert('Pinterest authorization failed: ' + error);
          navigate('/');
          return;
        }

        if (code) {
          const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const data = await response.json();
          
          if (data.success) {
            onPinterestAuth(data.access_token, data.user);
            alert(`Pinterest connected! Welcome ${data.user.username} 📌`);
          } else {
            const errorMessage = data.error || data.message || 'Unknown error';
            alert('Failed to connect Pinterest: ' + errorMessage);
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
  }, [searchParams, navigate, onPinterestAuth]);

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
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
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
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
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
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: '2rem' }}>📌</span>
          </div>
          
          <h1 className="heading-2" style={{ marginBottom: 'var(--space-md)' }}>
            Connecting Pinterest...
          </h1>
          
          <p className="body-medium" style={{ 
            marginBottom: 'var(--space-xl)',
            color: 'var(--text-secondary)'
          }}>
            Please wait while we set up your enhanced analysis.
          </p>
          
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(239, 68, 68, 0.3)',
            borderTop: '4px solid #ef4444',
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

export default PinterestCallback;
