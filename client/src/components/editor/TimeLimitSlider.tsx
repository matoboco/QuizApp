import { MIN_TIME_LIMIT, MAX_TIME_LIMIT } from '@shared/types/quiz';

interface TimeLimitSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function TimeLimitSlider({ value, onChange }: TimeLimitSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Time Limit</label>
        <span className="text-sm font-semibold text-primary-400">
          {value} seconds
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{MIN_TIME_LIMIT}s</span>
        <input
          type="range"
          min={MIN_TIME_LIMIT}
          max={MAX_TIME_LIMIT}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-cyber-elevated rounded-lg appearance-none cursor-pointer accent-primary-400"
        />
        <span className="text-xs text-gray-400">{MAX_TIME_LIMIT}s</span>
      </div>
    </div>
  );
}
