import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/host/DashboardPage';
import QuizEditorPage from '@/pages/host/QuizEditorPage';
import PlayerJoinPage from '@/pages/player/PlayerJoinPage';
import PlayerGamePage from '@/pages/player/PlayerGamePage';
import HostGamePage from '@/pages/host/HostGamePage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public player routes (no auth required) */}
            <Route path="/play" element={<PlayerJoinPage />} />
            <Route path="/play/:sessionId" element={<PlayerGamePage />} />

            {/* Protected host routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/quiz/:id/edit" element={<QuizEditorPage />} />
              </Route>
              <Route path="/host/:sessionId" element={<HostGamePage />} />
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
