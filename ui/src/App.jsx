import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import { AppShell } from './components/AppShell.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

function PublicOnly({ children }) {
  const { token, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-slate-600">
        Loading…
      </div>
    );
  }

  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
