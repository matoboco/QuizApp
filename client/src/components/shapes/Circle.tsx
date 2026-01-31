import React from 'react';

interface CircleProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Circle: React.FC<CircleProps> = ({
  color = '#d89e00',
  size = 24,
  className = '',
}) => {
  const center = size / 2;
  const radius = size * 0.45;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx={center} cy={center} r={radius} fill={color} />
    </svg>
  );
};

export default Circle;
