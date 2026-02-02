import React from 'react';

interface StarProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Star: React.FC<StarProps> = ({
  color = '#d35400',
  size = 24,
  className = '',
}) => {
  // 5-pointed star
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.2;
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <polygon points={points} fill={color} />
    </svg>
  );
};

export default Star;
