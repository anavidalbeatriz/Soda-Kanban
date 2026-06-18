import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/client";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceApi.list().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const isMember = workspaces.some((workspace) => workspace.id === workspaceId);
  if (!isMember) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
