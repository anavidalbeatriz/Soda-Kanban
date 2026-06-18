import { Link } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { cardClass } from "../components/ui/styles";
import { workspaceApi } from "../api/client";
import { useQuery } from "@tanstack/react-query";

export function DashboardPage() {
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceApi.list().then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader />

      <PageShell>
        <h2 className="text-lg font-semibold text-white mb-4">Your workspaces</h2>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : workspaces.length === 0 ? (
          <p className="text-gray-500">No workspaces yet.</p>
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
    </div>
  );
}
