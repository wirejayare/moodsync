import React, { useEffect, useRef } from 'react';

const LiquidText = ({ children, className = '', trigger = 'load' }) => {
  const textRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    // Add liquid wave effect using CSS transforms
    const addLiquidEffect = () => {
      text.style.animation = 'liquidWave 4s ease-in-out infinite';
    };

    if (trigger === 'load') {
      addLiquidEffect();
    }

    return () => {
      if (text) {
        text.style.animation = '';
      }
    };
  }, [trigger]);

  return (
    <div className={`liquid-text ${className}`}>
      <span 
        ref={textRef}
        className="liquid-text-inner"
        style={{
          background: 'linear-gradient(45deg, #fff, #f0f0f0, #fff, #e0e0e0, #fff)',
          backgroundSize: '200% 200%',
          animation: 'liquidGradient 3s ease-in-out infinite',
          display: 'inline-block',
          position: 'relative',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
        }}
      >
        {children}
      </span>
    </div>
  );
};

export default LiquidText; 