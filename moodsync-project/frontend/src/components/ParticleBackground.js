import React, { useRef, useEffect } from 'react';

const COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', // Bright debug colors
  '#1a0000', '#330000', '#2d0000', '#4d0000',
  '#000000', '#1a1a1a', '#2d2d2d', '#404040'
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

const NUM_PARTICLES = 60;

function ParticleBackground() {
  const canvasRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    console.log('ParticleBackground: Canvas initialized', { width, height });

    function createParticle() {
      const size = randomBetween(30, 80); // Larger particles for debug
      return {
        x: randomBetween(0, width),
        y: randomBetween(0, height),
        vx: randomBetween(-0.08, 0.08),
        vy: randomBetween(-0.04, 0.04),
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: randomBetween(0.3, 0.8), // Higher opacity for debug
        blur: randomBetween(2, 8), // Less blur for debug
      };
    }

    particles.current = Array.from({ length: NUM_PARTICLES }, createParticle);
    console.log('ParticleBackground: Created', particles.current.length, 'particles');

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.filter = `blur(${p.blur}px)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
        // Move
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;
      }
      requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Higher z-index for debug
        pointerEvents: 'none',
        border: '2px solid yellow', // Debug border
      }}
    />
  );
}

export default ParticleBackground; 