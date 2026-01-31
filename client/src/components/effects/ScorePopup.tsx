import React, { useEffect, useState } from 'react';

interface ScorePopupProps {
  score: number;
  isVisible: boolean;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ score, isVisible }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure the element is mounted before triggering animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
    }
  }, [isVisible]);

  const handleTransitionEnd = () => {
    if (!isVisible) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  const isPositive = score >= 0;
  const displayText = isPositive ? `+${score}` : `${score}`;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        zIndex: 50,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className="font-display font-bold whitespace-nowrap"
        style={{
          transform: animating
            ? 'translate(-50%, -50%) scale(1) translateY(-40px)'
            : 'translate(-50%, -50%) scale(0) translateY(0px)',
          opacity: animating ? 0 : 1,
          fontSize: '2rem',
          color: isPositive ? '#22c55e' : '#ef4444',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
        }}
      >
        {displayText} points
      </div>
    </div>
  );
};

export default ScorePopup;
