import { UserRepository } from './user.repository';
import { QuizRepository } from './quiz.repository';
import { GameRepository } from './game.repository';
import { PlayerRepository } from './player.repository';
import { PlayerAnswerRepository } from './player-answer.repository';
import { VerificationCodeRepository } from './verification-code.repository';

// Export singleton instances of all repositories
export const userRepository = new UserRepository();
export const quizRepository = new QuizRepository();
export const gameRepository = new GameRepository();
export const playerRepository = new PlayerRepository();
export const playerAnswerRepository = new PlayerAnswerRepository();
export const verificationCodeRepository = new VerificationCodeRepository();

// Re-export the classes for type usage or custom instantiation
export { UserRepository } from './user.repository';
export { QuizRepository } from './quiz.repository';
export { GameRepository } from './game.repository';
export { PlayerRepository } from './player.repository';
export { PlayerAnswerRepository } from './player-answer.repository';
export { VerificationCodeRepository } from './verification-code.repository';
