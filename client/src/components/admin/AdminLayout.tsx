import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="bg-cyber-surface border-b border-neon-purple/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <NavLink to="/dashboard" className="text-xl font-bold text-neon-purple">
                {APP_NAME}
              </NavLink>
              <span className="px-2 py-1 text-xs font-medium bg-neon-purple/20 text-neon-purple-light rounded">
                Admin Panel
              </span>
            </div>

            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors',
                      isActive ? 'text-neon-purple' : 'text-gray-400 hover:text-gray-100'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <NavLink
                to="/dashboard"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Back to App
              </NavLink>
              <div className="h-4 w-px bg-primary-500/20" />
              <span className="text-sm text-gray-400">{user?.username}</span>
              <button
                onClick={logout}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
