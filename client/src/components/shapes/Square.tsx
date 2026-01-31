import React from 'react';

interface SquareProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Square: React.FC<SquareProps> = ({
  color = '#26890c',
  size = 24,
  className = '',
}) => {
  const inset = size * 0.1;
  const sideLength = size - 2 * inset;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x={inset} y={inset} width={sideLength} height={sideLength} fill={color} />
    </svg>
  );
};

export default Square;
