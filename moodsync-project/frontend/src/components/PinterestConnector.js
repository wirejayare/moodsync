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
