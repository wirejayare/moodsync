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
    <main className="pcb-callback-bg" aria-label="Pinterest OAuth Callback">
      {/* Background decorative elements */}
      <div className="pcb-bg-decor">
        <div className="pcb-bg-circle pcb-bg-circle-1" />
        <div className="pcb-bg-circle pcb-bg-circle-2" />
      </div>
      <div className="pcb-center">
        <section className="card glass-strong animate-fade-in-up pcb-card">
          <div className="pcb-icon-circle">
            <span className="pcb-icon">📌</span>
          </div>
          <h1 className="heading-2 pcb-title">Connecting Pinterest...</h1>
          <p className="body-medium pcb-desc">
            Please wait while we set up your enhanced analysis.
          </p>
          <div className="pcb-spinner" aria-busy={isProcessing} aria-label="Loading" />
        </section>
      </div>
    </main>
  );
};

export default PinterestCallback;
