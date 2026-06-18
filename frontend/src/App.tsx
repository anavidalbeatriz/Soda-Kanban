import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { WorkspacePage } from "./pages/WorkspacePage";
import { BoardPage } from "./pages/BoardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { DashboardRedirect, WorkspaceGuard } from "./components/WorkspaceGuard";

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardRedirect />} />
        <Route
          path="/workspaces/:workspaceId"
          element={
            <WorkspaceGuard>
              <WorkspacePage />
            </WorkspaceGuard>
          }
        />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
