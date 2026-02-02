import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <NavLink to="/dashboard" className="text-xl font-bold text-indigo-600">
                QuizApp
              </NavLink>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
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
                      isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
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
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to App
              </NavLink>
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">{user?.username}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
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
