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
          console.log('Pinterest callback code received');
          
          const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const data = await response.json();
          
          if (data.success) {
            console.log('Pinterest authentication successful');
            onPinterestAuth(data.access_token, data.user);
            alert(`Pinterest connected! Welcome ${data.user.username} 📌`);
          } else {
            alert('Failed to connect Pinterest: ' + data.message);
          }
        }
      } catch (error) {
        console.error('Pinterest callback error:', error);
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1>📌 Connecting Pinterest...</h1>
        <p>Please wait while we set up your enhanced analysis.</p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid #E60023',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
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
  );
};

export default PinterestCallback;
