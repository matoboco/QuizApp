import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthPendingVerification,
  AuthResult,
  VerifyEmailRequest,
  ResendCodeRequest,
  UserPublic,
  HostTokenPayload,
  PlayerTokenPayload,
  DisplayTokenPayload,
  TokenPayload,
} from '@shared/types';
import { userRepository, verificationCodeRepository } from '../db/repositories';
import { UnauthorizedError, ConflictError, BadRequestError } from '../middleware/error.middleware';
import { config } from '../config';
import { sendVerificationCode } from './email.service';

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function toUserPublic(user: { id: string; email: string; username: string; emailVerified: boolean; role: string; isActive: boolean; createdAt: string }): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified,
    role: user.role as UserPublic['role'],
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

class AuthService {
  async register(data: RegisterRequest): Promise<AuthPendingVerification> {
    // Check allowed email domains
    if (config.allowedEmailDomains.length > 0) {
      const domain = data.email.split('@')[1]?.toLowerCase();
      if (!domain || !config.allowedEmailDomains.includes(domain)) {
        throw new BadRequestError('The email domain you entered is not among the allowed domains.');
      }
    }

    // Check if email already exists
    const existingByEmail = await userRepository.findByEmail(data.email);
    if (existingByEmail) {
      throw new ConflictError('A user with this email already exists');
    }

    // Check if username already exists
    const existingByUsername = await userRepository.findByUsername(data.username);
    if (existingByUsername) {
      throw new ConflictError('A user with this username already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Check if this is the first user - they become superadmin
    const userCount = await userRepository.count();
    const role = userCount === 0 ? 'superadmin' : 'user';

    // Create user in database (unverified)
    const user = await userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      role,
    });

    // Generate and send verification code
    await this.createAndSendCode(user.id, user.email);

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful. Please check your email for a verification code.',
    };
  }

  async login(data: LoginRequest): Promise<AuthResult> {
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // If user is not verified, send a new code and return pending
    if (!user.emailVerified) {
      await this.createAndSendCode(user.id, user.email);
      return {
        requiresVerification: true,
        email: user.email,
        message: 'Email not verified. A new verification code has been sent to your email.',
      };
    }

    // Generate JWT token
    const token = this.generateHostToken(user.id, user.email, user.role);

    return { user: toUserPublic(user), token };
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    const codeRecord = await verificationCodeRepository.findLatestUnusedByEmail(data.email);
    if (!codeRecord) {
      throw new BadRequestError('No verification code found. Please request a new one.');
    }

    // Check if code has expired
    if (new Date(codeRecord.expiresAt) < new Date()) {
      throw new BadRequestError('Verification code has expired. Please request a new one.');
    }

    // Check if code matches
    if (codeRecord.code !== data.code) {
      throw new BadRequestError('Invalid verification code.');
    }

    // Mark code as used
    await verificationCodeRepository.markUsed(codeRecord.id);

    // Mark user as verified
    await userRepository.markEmailVerified(user.id);

    // Generate JWT token
    const token = this.generateHostToken(user.id, user.email, user.role);

    return {
      user: { ...toUserPublic(user), emailVerified: true },
      token,
    };
  }

  async resendVerificationCode(data: ResendCodeRequest): Promise<void> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    if (user.emailVerified) {
      // Already verified, nothing to do
      return;
    }

    await this.createAndSendCode(user.id, user.email);
  }

  async createAndSendCode(userId: string, email: string): Promise<void> {
    // Invalidate previous codes
    await verificationCodeRepository.invalidateAllForUser(userId);

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Calculate expiry
    const expiresAt = new Date(
      Date.now() + config.verificationCodeExpiryMinutes * 60 * 1000
    ).toISOString();

    // Store code
    await verificationCodeRepository.create(userId, email, code, expiresAt);

    // Send email
    await sendVerificationCode(email, code);
  }

  generateHostToken(userId: string, email: string, role: string = 'user'): string {
    const payload: HostTokenPayload = {
      userId,
      email,
      type: 'host',
      role: role as HostTokenPayload['role'],
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

  generateDisplayToken(displayId: string, sessionId: string): string {
    const payload: DisplayTokenPayload = {
      displayId,
      sessionId,
      type: 'display',
    };

    const expiresIn = process.env.JWT_PLAYER_EXPIRY || '4h';

    return jwt.sign(payload, getJwtSecret(), { expiresIn });
  }

  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  }

  async getUserPublic(userId: string): Promise<UserPublic | null> {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) return null;
    return toUserPublic(user);
  }
}

export const authService = new AuthService();
