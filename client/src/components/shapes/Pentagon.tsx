import React from 'react';

interface PentagonProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Pentagon: React.FC<PentagonProps> = ({
  color = '#0097a7',
  size = 24,
  className = '',
}) => {
  // Regular pentagon
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
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

export default Pentagon;
