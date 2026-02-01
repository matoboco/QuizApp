import { Router } from 'express';
import { register, login, me, verifyEmail, resendCode } from './auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema, verifyEmailSchema, resendCodeSchema } from './auth.validation';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/verify', validate(verifyEmailSchema), verifyEmail);
authRouter.post('/resend-code', validate(resendCodeSchema), resendCode);
authRouter.get('/me', authenticate, me);

export { authRouter };
