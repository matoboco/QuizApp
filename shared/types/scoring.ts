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
  timeTaken: number; // ms
  streak: number;
}

export function calculateScore(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number,
  streak: number,
  config: ScoringConfig = DEFAULT_SCORING
): ScoreBreakdown {
  if (!isCorrect) {
    return {
      basePoints: 0,
      timeBonus: 0,
      streakMultiplier: 1,
      totalPoints: 0,
      isCorrect: false,
      timeTaken,
      streak: 0,
    };
  }

  const timeLimitMs = timeLimit * 1000;
  const timeRatio = Math.max(0, 1 - timeTaken / timeLimitMs);
  const timeBonus = Math.round(config.timeBonusMax * timeRatio);
  const streakMultiplier = Math.min(
    config.maxStreakMultiplier,
    1 + streak * config.streakMultiplierStep
  );
  const totalPoints = Math.round((config.basePoints + timeBonus) * streakMultiplier);

  return {
    basePoints: config.basePoints,
    timeBonus,
    streakMultiplier,
    totalPoints,
    isCorrect: true,
    timeTaken,
    streak,
  };
}
