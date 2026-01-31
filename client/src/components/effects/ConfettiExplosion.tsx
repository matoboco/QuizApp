import React, { useEffect, useState, useCallback } from 'react';

interface ConfettiExplosionProps {
  isActive: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

const CONFETTI_COLORS = [
  '#e21b3c', '#1368ce', '#d89e00', '#26890c',
  '#FFD700', '#FF69B4', '#00CED1', '#FF6347',
  '#7B68EE', '#32CD32', '#FF4500', '#1E90FF',
];

function createParticle(id: number, windowWidth: number): Particle {
  return {
    id,
    x: Math.random() * windowWidth,
    y: -20 - Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 8,
    velocityY: 2 + Math.random() * 4,
    rotationSpeed: (Math.random() - 0.5) * 10,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  };
}

export const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({
  isActive,
  duration = 5000,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [opacity, setOpacity] = useState(1);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      setOpacity(1);
      return;
    }

    // Create initial burst of particles
    const initialCount = 150;
    const initialParticles: Particle[] = [];
    for (let i = 0; i < initialCount; i++) {
      initialParticles.push(createParticle(i, windowSize.width));
    }
    setParticles(initialParticles);

    let nextId = initialCount;
    let spawnCount = 0;
    const maxSpawns = 200;

    // Continue spawning particles over time
    const spawnInterval = setInterval(() => {
      if (spawnCount >= maxSpawns) {
        clearInterval(spawnInterval);
        return;
      }
      const batch: Particle[] = [];
      const batchSize = Math.max(1, Math.floor(10 * (1 - spawnCount / maxSpawns)));
      for (let i = 0; i < batchSize; i++) {
        batch.push(createParticle(nextId++, windowSize.width));
      }
      setParticles((prev) => [...prev.slice(-200), ...batch]);
      spawnCount += batchSize;
    }, 100);

    // Start fading out near the end
    const fadeStart = duration - 1500;
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, fadeStart);

    // Cleanup everything when duration expires
    const cleanupTimer = setTimeout(() => {
      clearInterval(spawnInterval);
      setParticles([]);
      setOpacity(1);
    }, duration);

    return () => {
      clearInterval(spawnInterval);
      clearTimeout(fadeTimer);
      clearTimeout(cleanupTimer);
    };
  }, [isActive, duration, windowSize.width]);

  // Animation loop for particle physics
  useEffect(() => {
    if (particles.length === 0) return;

    let animationId: number;
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            rotation: p.rotation + p.rotationSpeed,
            velocityY: p.velocityY + 0.1, // gravity
            velocityX: p.velocityX * 0.99, // air resistance
          }))
          .filter((p) => p.y < windowSize.height + 50)
      );
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [particles.length > 0, windowSize.height]);

  if (!isActive && particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: windowSize.width,
        height: windowSize.height,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity,
        transition: 'opacity 1.5s ease-out',
      }}
    >
      <svg
        width={windowSize.width}
        height={windowSize.height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {particles.map((p) => {
          const transform = `translate(${p.x}, ${p.y}) rotate(${p.rotation})`;
          if (p.shape === 'circle') {
            return (
              <circle
                key={p.id}
                cx={0}
                cy={0}
                r={p.size / 2}
                fill={p.color}
                transform={transform}
              />
            );
          }
          return (
            <rect
              key={p.id}
              x={-p.size / 2}
              y={-p.size / 2}
              width={p.size}
              height={p.size * 0.6}
              fill={p.color}
              transform={transform}
              rx={1}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default ConfettiExplosion;
