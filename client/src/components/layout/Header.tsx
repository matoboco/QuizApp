import { useAuth } from '@/context/AuthContext';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import Button from '@/components/common/Button';
import { Link } from 'react-router-dom';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-cyber-surface border-b border-primary-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt={APP_NAME} className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-primary-400 leading-tight">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                {APP_TAGLINE}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user && ['admin', 'superadmin'].includes(user.role) && (
              <Link
                to="/admin"
                className="text-sm font-medium text-neon-purple hover:text-neon-purple-light"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-gray-400">
              {user?.username}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
