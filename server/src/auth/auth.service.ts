import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserPublic,
  HostTokenPayload,
  PlayerTokenPayload,
  TokenPayload,
} from '@shared/types';
import { userRepository } from '../db/repositories';
import { UnauthorizedError, ConflictError } from '../middleware/error.middleware';

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingByEmail = userRepository.findByEmail(data.email);
    if (existingByEmail) {
      throw new ConflictError('A user with this email already exists');
    }

    // Check if username already exists
    const existingByUsername = userRepository.findByUsername(data.username);
    if (existingByUsername) {
      throw new ConflictError('A user with this username already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Create user in database
    const user = userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
    });

    // Generate JWT token
    const token = this.generateHostToken(user.id, user.email);

    // Build public user object
    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };

    return { user: userPublic, token };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateHostToken(user.id, user.email);

    // Build public user object
    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };

    return { user: userPublic, token };
  }

  generateHostToken(userId: string, email: string): string {
    const payload: HostTokenPayload = {
      userId,
      email,
      type: 'host',
    };

    const expiresIn = process.env.JWT_HOST_EXPIRY || '7d';

    return jwt.sign(payload, getJwtSecret(), { expiresIn });
  }

  generatePlayerToken(playerId: string, sessionId: string): string {
    const payload: PlayerTokenPayload = {
      playerId,
      sessionId,
      type: 'player',
    };

    const expiresIn = process.env.JWT_PLAYER_EXPIRY || '4h';

    return jwt.sign(payload, getJwtSecret(), { expiresIn });
  }

  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  }
}

export const authService = new AuthService();
