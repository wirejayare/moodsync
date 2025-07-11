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
        <h4 className="pc-heading">🚀 Get 10x Better Analysis</h4>
        <p className="pc-desc">
          Connect Pinterest to analyze your actual board content, descriptions, and pin details for much more accurate mood detection.
        </p>
        <div className="pc-comparison">
          <div className="pc-comparison-card no-pinterest">
            <strong>Without Pinterest:</strong><br/>
            URL analysis only<br/>
            ~70% accuracy
          </div>
          <div className="pc-comparison-card with-pinterest">
            <strong>With Pinterest:</strong><br/>
            Full content analysis<br/>
            ~90% accuracy
          </div>
        </div>
        <button
          className="pc-connect-btn"
          onClick={handlePinterestAuth}
          disabled={isConnecting}
          aria-busy={isConnecting}
        >
          {isConnecting ? '📌 Connecting...' : '📌 Connect Pinterest'}
        </button>
        <div className="pc-note">
          We only read your public boards • No posting or modifications
        </div>
      </div>
    </section>
  );
};

export default PinterestConnector;
