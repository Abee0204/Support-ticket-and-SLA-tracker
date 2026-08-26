import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const { user, loading, login, register, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/register"
        element={<RegisterPage onRegister={register} />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={!!user} loading={loading}>
            {user && <DashboardPage user={user} onLogout={logout} />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
