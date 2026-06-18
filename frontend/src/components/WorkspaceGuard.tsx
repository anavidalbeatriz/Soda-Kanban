import { FormEvent, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { workspaceApi } from "../api/client";
import { btnPrimary, inputClass, labelClass } from "./ui/styles";
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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [workspaceName, setWorkspaceName] = useState(user?.name ? `${user.name}'s Workspace` : "My Workspace");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.workspace_id) {
    return <Navigate to={`/workspaces/${user.workspace_id}`} replace />;
  }

  const handleCreateWorkspace = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const { data: workspace } = await workspaceApi.create(workspaceName.trim());
      updateUser({ ...user, workspace_id: workspace.id });
      navigate(`/workspaces/${workspace.id}`);
    } catch {
      setError("Could not create workspace. Try again or ask your admin for an invite link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-2">No workspace yet</h1>
        <p className="text-gray-400 text-sm mb-6">
          Create a workspace to get started, or register with an invite link from your admin.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className={labelClass}>Workspace name</label>
            <input
              required
              className={inputClass}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className={`w-full ${btnPrimary} py-2.5`}>
            {loading ? "Creating..." : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
