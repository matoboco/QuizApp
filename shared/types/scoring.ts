export interface ScoringConfig {
  basePoints: number;
  timeBonusMax: number;
  streakMultiplierStep: number;
  maxStreakMultiplier: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  basePoints: 1000,
  timeBonusMax: 500,
  streakMultiplierStep: 0.1,
  maxStreakMultiplier: 2.0,
};

export interface ScoreBreakdown {
  basePoints: number;
  timeBonus: number;
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
  config: ScoringConfig = DEFAULT_SCORING
): ScoreBreakdown {
  if (correctRatio <= 0) {
    return {
      basePoints: 0,
      timeBonus: 0,
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
  const timeBonus = Math.round(config.timeBonusMax * timeRatio * correctRatio);
  const streakMultiplier = Math.min(
    config.maxStreakMultiplier,
    1 + streak * config.streakMultiplierStep
  );
  const basePoints = Math.round(config.basePoints * correctRatio);
  const totalPoints = Math.round((basePoints + timeBonus) * streakMultiplier);

  return {
    basePoints,
    timeBonus,
    streakMultiplier,
    totalPoints,
    isCorrect: correctRatio >= 1.0,
    correctRatio,
    timeTaken,
    streak,
  };
}
