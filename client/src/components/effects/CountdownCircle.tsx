import React, { useMemo } from 'react';

interface CountdownCircleProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
}

function getTimerColor(fraction: number): string {
  if (fraction > 0.5) return '#22c55e'; // green
  if (fraction > 0.25) return '#eab308'; // yellow
  return '#ef4444'; // red
}

export const CountdownCircle: React.FC<CountdownCircleProps> = ({
  totalSeconds,
  remainingSeconds,
  size = 120,
}) => {
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const isUrgent = remainingSeconds <= 5 && remainingSeconds > 0;
  const color = getTimerColor(fraction);

  const { radius, circumference, strokeDashoffset, strokeWidth, center, fontSize } =
    useMemo(() => {
      const sw = Math.max(4, size * 0.08);
      const r = (size - sw) / 2;
      const c = 2 * Math.PI * r;
      const offset = c * (1 - fraction);
      const cx = size / 2;
      const fs = size * 0.35;
      return {
        radius: r,
        circumference: c,
        strokeDashoffset: offset,
        strokeWidth: sw,
        center: cx,
        fontSize: fs,
      };
    }, [size, fraction]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        animation: isUrgent ? 'countdownPulse 0.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Inject pulse keyframes */}
      <style>{`
        @keyframes countdownPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
        />

        {/* Animated progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.4s ease-out',
          }}
        />
      </svg>

      {/* Center text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color }}
      >
        <span
          className="font-display font-bold tabular-nums"
          style={{
            fontSize,
            lineHeight: 1,
            transition: 'color 0.4s ease-out',
          }}
        >
          {Math.ceil(remainingSeconds)}
        </span>
      </div>
    </div>
  );
};

export default CountdownCircle;
