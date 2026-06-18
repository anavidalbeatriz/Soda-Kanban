import { Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const user = useAuthStore((s) => s.user);

  if (user?.workspace_id && workspaceId && user.workspace_id !== workspaceId) {
    return <Navigate to={`/workspaces/${user.workspace_id}`} replace />;
  }

  return <>{children}</>;
}

export function DashboardRedirect() {
  const user = useAuthStore((s) => s.user);

  if (user?.workspace_id) {
    return <Navigate to={`/workspaces/${user.workspace_id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <p className="text-gray-400">No workspace assigned. Ask your admin for an invite link.</p>
    </div>
  );
}
