import React, { useEffect, useRef } from 'react';

const LiquidText = ({ children, className = '', trigger = 'load' }) => {
  const textRef = useRef(null);
  const maskRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    const mask = maskRef.current;
    
    if (!text || !mask) return;

    // Create animated wave path for SVG mask
    const createWavePath = (time) => {
      const width = text.offsetWidth;
      const height = text.offsetHeight;
      const frequency = 0.02;
      const amplitude = 8;
      const speed = 0.001;
      
      let path = `M 0 ${height / 2}`;
      
      for (let x = 0; x <= width; x += 2) {
        const y = height / 2 + 
          Math.sin(x * frequency + time * speed) * amplitude +
          Math.sin(x * frequency * 2 + time * speed * 1.5) * amplitude * 0.5;
        path += ` L ${x} ${y}`;
      }
      
      path += ` L ${width} ${height} L 0 ${height} Z`;
      return path;
    };

    // Animate the wave
    let animationId;
    let startTime = Date.now();
    
    const animate = () => {
      const time = Date.now() - startTime;
      const wavePath = createWavePath(time);
      
      if (mask.querySelector('path')) {
        mask.querySelector('path').setAttribute('d', wavePath);
      }
      
      animationId = requestAnimationFrame(animate);
    };

    // Start animation based on trigger
    if (trigger === 'load') {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [trigger]);

  return (
    <div className={`liquid-text ${className}`}>
      <svg
        ref={maskRef}
        className="liquid-mask"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        <defs>
          <mask id="liquid-mask">
            <rect width="100%" height="100%" fill="white" />
            <path
              fill="black"
              style={{
                transition: 'd 0.1s ease-out'
              }}
            />
          </mask>
        </defs>
      </svg>
      
      <span 
        ref={textRef}
        className="liquid-text-inner"
        style={{
          mask: 'url(#liquid-mask)',
          WebkitMask: 'url(#liquid-mask)',
          background: 'linear-gradient(45deg, #fff, #f0f0f0, #fff)',
          backgroundSize: '200% 200%',
          animation: 'liquidGradient 3s ease-in-out infinite',
          display: 'inline-block',
          position: 'relative'
        }}
      >
        {children}
      </span>
    </div>
  );
};

export default LiquidText; 