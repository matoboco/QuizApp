import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  timeLimit: number; // seconds
  startedAt: number; // timestamp (ms)
  onTimeUp?: () => void;
}

export default function CountdownTimer({
  timeLimit,
  startedAt,
  onTimeUp,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, timeLimit - elapsed);
      setRemaining(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [timeLimit, startedAt]);

  const seconds = Math.ceil(remaining);
  const fraction = remaining / timeLimit;

  // Color transitions: green -> yellow -> red
  let strokeColor = '#22c55e'; // green
  if (fraction <= 0.25) {
    strokeColor = '#ef4444'; // red
  } else if (fraction <= 0.5) {
    strokeColor = '#eab308'; // yellow
  }

  // SVG circle math
  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.15s linear, stroke 0.3s ease' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display font-bold text-white text-shadow"
          style={{ fontSize: seconds < 10 ? '3rem' : '2.5rem' }}
        >
          {seconds}
        </span>
      </div>
    </div>
  );
}
