export interface ScoringConfig {
  basePoints: number;
  timeBonusMax: number;
  streakMultiplierStep: number;
  maxStreakMultiplier: number;
  exactBonus: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  basePoints: 1000,
  timeBonusMax: 500,
  streakMultiplierStep: 0.1,
  maxStreakMultiplier: 2.0,
  exactBonus: 0.5,
};

export interface ScoreBreakdown {
  basePoints: number;
  timeBonus: number;
  exactBonus: number;
  streakMultiplier: number;
  totalPoints: number;
  isCorrect: boolean;
  correctRatio: number; // 0.0 - 1.0 for partial credit (multi-select, ordering)
  timeTaken: number; // ms
  streak: number;
}

export function calculateScore(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number,
  streak: number,
  correctRatio: number = isCorrect ? 1.0 : 0.0,
  config: ScoringConfig = DEFAULT_SCORING,
  options?: { noTimeBonus?: boolean }
): ScoreBreakdown {
  if (correctRatio <= 0) {
    return {
      basePoints: 0,
      timeBonus: 0,
      exactBonus: 0,
      streakMultiplier: 1,
      totalPoints: 0,
      isCorrect: false,
      correctRatio: 0,
      timeTaken,
      streak: 0,
    };
  }

  const timeLimitMs = timeLimit * 1000;
  const timeRatio = Math.max(0, 1 - timeTaken / timeLimitMs);
  const timeBonus = options?.noTimeBonus ? 0 : Math.round(config.timeBonusMax * timeRatio * correctRatio);
  const exactBonus = (options?.noTimeBonus && correctRatio >= 1.0) ? Math.round(config.basePoints * correctRatio * config.exactBonus) : 0;
  const streakMultiplier = Math.min(
    config.maxStreakMultiplier,
    1 + streak * config.streakMultiplierStep
  );
  const basePoints = Math.round(config.basePoints * correctRatio);
  const totalPoints = Math.round((basePoints + timeBonus + exactBonus) * streakMultiplier);

  return {
    basePoints,
    timeBonus,
    exactBonus,
    streakMultiplier,
    totalPoints,
    isCorrect: correctRatio >= 1.0,
    correctRatio,
    timeTaken,
    streak,
  };
}
