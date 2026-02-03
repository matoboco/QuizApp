import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import AdminGuard from '@/components/guards/AdminGuard';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import DashboardPage from '@/pages/host/DashboardPage';
import QuizEditorPage from '@/pages/host/QuizEditorPage';
import PlayerJoinPage from '@/pages/player/PlayerJoinPage';
import PlayerGamePage from '@/pages/player/PlayerGamePage';
import HostGamePage from '@/pages/host/HostGamePage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import QuizHistoryPage from '@/pages/history/QuizHistoryPage';
import GameHistoryPage from '@/pages/history/GameHistoryPage';
import SharedGamePage from '@/pages/history/SharedGamePage';
import DisplayPage from '@/pages/display/DisplayPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />

            {/* Public player routes (no auth required) */}
            <Route path="/play" element={<PlayerJoinPage />} />
            <Route path="/play/:sessionId" element={<PlayerGamePage />} />

            {/* Public display route (no auth required) */}
            <Route path="/display" element={<DisplayPage />} />

            {/* Public shared game history */}
            <Route path="/shared/:shareToken" element={<SharedGamePage />} />

            {/* Protected host routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/quiz/:id/edit" element={<QuizEditorPage />} />
                <Route path="/quiz/:id/view" element={<QuizEditorPage readOnly />} />
              </Route>
              <Route path="/host/:sessionId" element={<HostGamePage />} />

              {/* History routes */}
              <Route path="/quiz/:quizId/history" element={<QuizHistoryPage />} />
              <Route path="/game/:gameId/history" element={<GameHistoryPage />} />

              {/* Admin routes */}
              <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
