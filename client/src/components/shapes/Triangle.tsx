import React from 'react';

interface TriangleProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Triangle: React.FC<TriangleProps> = ({
  color = '#e21b3c',
  size = 24,
  className = '',
}) => {
  // Equilateral triangle inscribed within the viewBox
  const points = `${size / 2},${size * 0.1} ${size * 0.9},${size * 0.9} ${size * 0.1},${size * 0.9}`;

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

export default Triangle;
