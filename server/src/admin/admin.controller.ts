import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { ApiResponse, HostTokenPayload, AdminUserListResponse, AdminUserView, AdminStats } from '@shared/types';

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await adminService.getUsers({ page, pageSize, search });

    const response: ApiResponse<AdminUserListResponse> = {
      success: true,
      data: {
        users: result.users,
        total: result.total,
        page,
        pageSize,
      },
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id);

    const response: ApiResponse<AdminUserView> = {
      success: true,
      data: user,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = (req.user as HostTokenPayload).userId;

    await adminService.deactivateUser(id, adminId);

    const response: ApiResponse = {
      success: true,
      message: 'User deactivated successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function activateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await adminService.activateUser(id);

    const response: ApiResponse = {
      success: true,
      message: 'User activated successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await adminService.resetPassword(id);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset email sent',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function changeEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { email } = req.body;

    await adminService.changeEmail(id, email);

    const response: ApiResponse = {
      success: true,
      message: 'Email changed successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = (req.user as HostTokenPayload).userId;

    await adminService.deleteUser(id, adminId);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function setUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = (req.user as HostTokenPayload).userId;

    await adminService.setUserRole(id, role, adminId);

    const response: ApiResponse = {
      success: true,
      message: 'User role updated successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await adminService.getStats();

    const response: ApiResponse<AdminStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}
