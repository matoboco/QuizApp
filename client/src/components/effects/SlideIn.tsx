import React, { useEffect, useState } from 'react';

interface SlideInProps {
  direction: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

const DIRECTION_TRANSFORMS: Record<SlideInProps['direction'], string> = {
  left: 'translateX(-100%)',
  right: 'translateX(100%)',
  up: 'translateY(-100%)',
  down: 'translateY(100%)',
};

export const SlideIn: React.FC<SlideInProps> = ({
  direction,
  delay = 0,
  duration = 300,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const initialTransform = DIRECTION_TRANSFORMS[direction];

  return (
    <div
      style={{
        transform: isVisible ? 'translate(0, 0)' : initialTransform,
        opacity: isVisible ? 1 : 0,
        transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
};

export default SlideIn;
