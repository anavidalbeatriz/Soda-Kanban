import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { InputModal } from "../components/ui/InputModal";
import { btnPrimary, cardClass } from "../components/ui/styles";
import { workspaceApi } from "../api/client";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceApi.list().then((r) => r.data),
  });

  const createWorkspace = useMutation({
    mutationFn: (name: string) => workspaceApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setWorkspaceModalOpen(false);
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader
        title="Your workspaces"
        actions={
          <button onClick={() => setWorkspaceModalOpen(true)} className={btnPrimary}>
            New workspace
          </button>
        }
      />

      <PageShell>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No workspaces yet.</p>
            <button onClick={() => setWorkspaceModalOpen(true)} className={btnPrimary}>
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Link key={ws.id} to={`/workspaces/${ws.id}`} className={cardClass}>
                <h3 className="font-medium text-white">{ws.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </PageShell>

      <InputModal
        open={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        title="New workspace"
        label="Workspace name"
        placeholder="My workspace"
        submitLabel="Create workspace"
        onSubmit={(name) => createWorkspace.mutate(name)}
        isSubmitting={createWorkspace.isPending}
      />
    </div>
  );
}
