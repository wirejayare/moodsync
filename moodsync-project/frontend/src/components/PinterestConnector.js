import React, { useState } from 'react';

const PinterestConnector = ({ onPinterestAuth, pinterestUser }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handlePinterestAuth = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/auth-url`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Pinterest auth error:', error);
      alert('Error connecting to Pinterest: ' + error.message);
      setIsConnecting(false);
    }
  };

  if (pinterestUser) {
    return (
      <div style={{
        background: 'rgba(230, 0, 35, 0.1)',
        border: '2px solid rgba(230, 0, 35, 0.3)',
        padding: '1rem',
        borderRadius: '10px',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📌</span>
          <div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>
              Pinterest Connected!
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, color: 'white' }}>
              @{pinterestUser.username} • Enhanced analysis enabled
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '1.5rem',
      borderRadius: '10px',
      marginBottom: '1rem',
      border: '2px dashed rgba(255,255,255,0.3)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>
          🚀 Get 10x Better Analysis
        </h4>
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px', 
          opacity: 0.9,
          color: 'white'
        }}>
          Connect Pinterest to analyze your actual board content, descriptions, and pin details for much more accurate mood detection.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '10px', 
          marginBottom: '15px',
          fontSize: '12px'
        }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '8px', 
            borderRadius: '5px',
            color: 'white'
          }}>
            <strong>Without Pinterest:</strong><br/>
            URL analysis only<br/>
            ~70% accuracy
          </div>
          <div style={{ 
            background: 'rgba(230, 0, 35, 0.2)', 
            padding: '8px', 
            borderRadius: '5px',
            color: 'white'
          }}>
            <strong>With Pinterest:</strong><br/>
            Full content analysis<br/>
            ~90% accuracy
          </div>
        </div>
        
        <button
          onClick={handlePinterestAuth}
          disabled={isConnecting}
          style={{
            background: '#E60023',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '16px',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isConnecting ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isConnecting ? '📌 Connecting...' : '📌 Connect Pinterest'}
        </button>
        
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7, 
          marginTop: '10px',
          color: 'white'
        }}>
          We only read your public boards • No posting or modifications
        </div>
      </div>
    </div>
  );
};

export default PinterestConnector;
