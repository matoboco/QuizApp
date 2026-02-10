import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  getAdminUsersApi,
  deactivateUserApi,
  activateUserApi,
  resetPasswordApi,
  deleteUserApi,
  setUserRoleApi,
  changeUserEmailApi,
} from '@/api/admin.api';
import type { AdminUserView, AdminUserListResponse } from '@shared/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { cn } from '@/lib/utils';

function UserActionsDropdown({
  user,
  currentUserId,
  isSuperadmin,
  onAction,
}: {
  user: AdminUserView;
  currentUserId: string;
  isSuperadmin: boolean;
  onAction: (action: string, user: AdminUserView) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const isCurrentUser = user.id === currentUserId;
  const canModifyRole = isSuperadmin && !isCurrentUser && user.role !== 'superadmin';
  const canDelete = isSuperadmin && !isCurrentUser && user.role !== 'superadmin';
  const canToggleActive = !isCurrentUser && user.role !== 'superadmin';

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-1 text-gray-400 hover:text-gray-200 rounded"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-40 bg-cyber-elevated rounded-md shadow-lg border border-primary-500/20 py-1"
            style={{ top: menuPos.top, right: `calc(100vw - ${menuPos.left}px)` }}
          >
            {canToggleActive && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onAction(user.isActive ? 'deactivate' : 'activate', user);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 whitespace-nowrap"
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                onAction('reset-password', user);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
            >
              Reset Password
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onAction('change-email', user);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
            >
              Change Email
            </button>
            {canModifyRole && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onAction('change-role', user);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 whitespace-nowrap"
              >
                Change Role
              </button>
            )}
            {canDelete && (
              <>
                <div className="border-t border-primary-500/10 my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onAction('delete', user);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 whitespace-nowrap"
                >
                  Delete User
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    superadmin: 'bg-primary-500/20 text-primary-300',
    admin: 'bg-neon-purple/20 text-neon-purple-light',
    user: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded',
        styles[role as keyof typeof styles] || styles.user
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded',
        isActive ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    variant?: 'danger' | 'default';
  } | null>(null);
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; user: AdminUserView | null }>({
    isOpen: false,
    user: null,
  });
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: AdminUserView | null }>({
    isOpen: false,
    user: null,
  });
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  const isSuperadmin = currentUser?.role === 'superadmin';

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAdminUsersApi(page, pageSize, search || undefined);
      setData(result);
    } catch {
      addToast('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleAction = async (action: string, user: AdminUserView) => {
    switch (action) {
      case 'deactivate':
        setConfirmModal({
          isOpen: true,
          title: 'Deactivate User',
          message: `Are you sure you want to deactivate ${user.username}? They will not be able to log in.`,
          action: async () => {
            await deactivateUserApi(user.id);
            addToast('success', 'User deactivated');
            loadUsers();
          },
        });
        break;

      case 'activate':
        setConfirmModal({
          isOpen: true,
          title: 'Activate User',
          message: `Are you sure you want to activate ${user.username}?`,
          action: async () => {
            await activateUserApi(user.id);
            addToast('success', 'User activated');
            loadUsers();
          },
        });
        break;

      case 'reset-password':
        setConfirmModal({
          isOpen: true,
          title: 'Reset Password',
          message: `This will generate a new password and send it to ${user.email}. Continue?`,
          action: async () => {
            await resetPasswordApi(user.id);
            addToast('success', 'Password reset email sent');
          },
        });
        break;

      case 'change-email':
        setNewEmail(user.email);
        setEmailModal({ isOpen: true, user });
        break;

      case 'change-role':
        setNewRole(user.role === 'admin' ? 'user' : 'admin');
        setRoleModal({ isOpen: true, user });
        break;

      case 'delete':
        setConfirmModal({
          isOpen: true,
          title: 'Delete User',
          message: `Are you sure you want to permanently delete ${user.username}? This will also delete all their quizzes and games. This action cannot be undone.`,
          variant: 'danger',
          action: async () => {
            await deleteUserApi(user.id);
            addToast('success', 'User deleted');
            loadUsers();
          },
        });
        break;
    }
  };

  const handleEmailChange = async () => {
    if (!emailModal.user || !newEmail) return;
    try {
      await changeUserEmailApi(emailModal.user.id, newEmail);
      addToast('success', 'Email changed');
      setEmailModal({ isOpen: false, user: null });
      loadUsers();
    } catch {
      addToast('error', 'Failed to change email');
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal.user) return;
    try {
      await setUserRoleApi(roleModal.user.id, newRole);
      addToast('success', 'Role updated');
      setRoleModal({ isOpen: false, user: null });
      loadUsers();
    } catch {
      addToast('error', 'Failed to update role');
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by email or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="bg-cyber-card border border-primary-500/15 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-primary-500/10">
              <thead className="bg-cyber-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Games
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-cyber-card divide-y divide-primary-500/10">
                {data?.users.map((user) => (
                  <tr key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-100">{user.username}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.quizCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.gameCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <UserActionsDropdown
                        user={user}
                        currentUserId={currentUser?.id || ''}
                        isSuperadmin={isSuperadmin}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirm Modal */}
      {confirmModal?.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmModal(null)}
          title={confirmModal.title}
        >
          <p className="text-gray-400 mb-6">{confirmModal.message}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmModal.variant === 'danger' ? 'danger' : 'primary'}
              onClick={async () => {
                await confirmModal.action();
                setConfirmModal(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </Modal>
      )}

      {/* Email Modal */}
      {emailModal.isOpen && emailModal.user && (
        <Modal
          isOpen={true}
          onClose={() => setEmailModal({ isOpen: false, user: null })}
          title="Change Email"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Email for {emailModal.user.username}
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEmailModal({ isOpen: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleEmailChange}>Save</Button>
          </div>
        </Modal>
      )}

      {/* Role Modal */}
      {roleModal.isOpen && roleModal.user && (
        <Modal
          isOpen={true}
          onClose={() => setRoleModal({ isOpen: false, user: null })}
          title="Change Role"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Role for {roleModal.user.username}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newRole === 'user'}
                  onChange={() => setNewRole('user')}
                  className="text-primary-500"
                />
                <span>User</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newRole === 'admin'}
                  onChange={() => setNewRole('admin')}
                  className="text-primary-500"
                />
                <span>Admin</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRoleModal({ isOpen: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
