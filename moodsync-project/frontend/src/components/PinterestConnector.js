import React, { useState } from 'react';

const PinterestConnector = ({ onPinterestAuth, pinterestUser }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handlePinterestAuth = async () => {
    setIsConnecting(true);
    try {
      console.log('🔍 Starting Pinterest auth request...');
      const response = await fetch(`https://moodsync-backend-sdbe.onrender.com/api/pinterest/auth-url`);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Pinterest auth request failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      if (!data.authUrl) {
        console.error('❌ No authUrl in response:', data);
        throw new Error('No auth URL received from server');
      }
      
      console.log('✅ Redirecting to Pinterest auth URL:', data.authUrl);
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('❌ Pinterest auth error:', error);
      alert('Error connecting to Pinterest: ' + error.message);
      setIsConnecting(false);
    }
  };

  if (pinterestUser) {
    return (
      <section className="apple-glass pinterest-connector connected" aria-label="Pinterest Connected">
        <div className="pc-connected-row">
          <span className="pc-icon">📌</span>
          <div>
            <div className="pc-title">Pinterest Connected!</div>
            <div className="pc-user">@{pinterestUser.username} • Enhanced analysis enabled</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="apple-glass pinterest-connector" aria-label="Connect Pinterest">
      <div className="pc-content">
        <button
          className="pc-connect-btn"
          onClick={handlePinterestAuth}
          disabled={isConnecting}
          aria-busy={isConnecting}
        >
          {isConnecting ? '📌 Connecting...' : '📌 Connect Pinterest'}
        </button>
      </div>
    </section>
  );
};

export default PinterestConnector;
