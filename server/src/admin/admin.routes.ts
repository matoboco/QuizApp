import { Router } from 'express';
import { authenticate, requireAdmin, requireSuperadmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';
import {
  getUsers,
  getUserById,
  deactivateUser,
  activateUser,
  resetPassword,
  changeEmail,
  deleteUser,
  setUserRole,
  getStats,
} from './admin.controller';

const adminRouter = Router();

// Validation schemas
const changeEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const setRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: 'Role must be either "user" or "admin"' }),
  }),
});

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

// Stats
adminRouter.get('/stats', getStats);

// Users list and detail
adminRouter.get('/users', getUsers);
adminRouter.get('/users/:id', getUserById);

// User actions (admin)
adminRouter.post('/users/:id/deactivate', deactivateUser);
adminRouter.post('/users/:id/activate', activateUser);
adminRouter.post('/users/:id/reset-password', resetPassword);
adminRouter.put('/users/:id/email', validate(changeEmailSchema), changeEmail);

// User actions (superadmin only)
adminRouter.delete('/users/:id', requireSuperadmin, deleteUser);
adminRouter.put('/users/:id/role', requireSuperadmin, validate(setRoleSchema), setUserRole);

export { adminRouter };
