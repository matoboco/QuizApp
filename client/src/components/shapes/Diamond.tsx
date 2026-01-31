import React from 'react';

interface DiamondProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Diamond: React.FC<DiamondProps> = ({
  color = '#1368ce',
  size = 24,
  className = '',
}) => {
  // Rhombus shape: top, right, bottom, left
  const points = `${size / 2},${size * 0.05} ${size * 0.95},${size / 2} ${size / 2},${size * 0.95} ${size * 0.05},${size / 2}`;

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

export default Diamond;
