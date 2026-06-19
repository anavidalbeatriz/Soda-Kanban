import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { InputModal } from "../components/ui/InputModal";
import { btnPrimary, btnSecondary, cardClass } from "../components/ui/styles";
import { boardApi, workspaceApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import type { Board } from "../types";

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards", workspaceId],
    queryFn: () => workspaceApi.boards(workspaceId!).then((r) => r.data),
    enabled: !!workspaceId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => workspaceApi.members(workspaceId!).then((r) => r.data),
    enabled: !!workspaceId,
  });

  const currentMembership = members.find((m) => m.user_id === currentUser?.id);
  const isAdmin =
    currentMembership?.role === "owner" || currentMembership?.role === "admin";

  const createBoard = useMutation({
    mutationFn: (name: string) => workspaceApi.createBoard(workspaceId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", workspaceId] });
      setBoardModalOpen(false);
    },
  });

  const deleteBoard = useMutation({
    mutationFn: (boardId: string) => boardApi.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", workspaceId] });
      setBoardToDelete(null);
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader
        backTo={{ label: "Workspaces", href: "/" }}
        title="Boards"
        actions={
          <>
            <button onClick={() => setBoardModalOpen(true)} className={btnPrimary}>
              New board
            </button>
            {isAdmin && (
              <Link to={`/workspaces/${workspaceId}/admin`} className={btnSecondary}>
                Manage team
              </Link>
            )}
          </>
        }
      />

      <PageShell>
        {isLoading ? (
          <p className="text-gray-500">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="text-gray-500">No boards yet. Create your first board.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <div key={board.id} className={`${cardClass} relative group`}>
                <Link to={`/boards/${board.id}`} className="block">
                  <h3 className="font-medium text-white pr-8">{board.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{board.visibility}</p>
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setBoardToDelete(board)}
                    className="absolute top-4 right-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity"
                    aria-label={`Delete ${board.name}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </PageShell>

      <InputModal
        open={boardModalOpen}
        onClose={() => setBoardModalOpen(false)}
        title="New board"
        label="Board name"
        placeholder="My board"
        submitLabel="Create board"
        onSubmit={(name) => createBoard.mutate(name)}
        isSubmitting={createBoard.isPending}
      />

      <ConfirmModal
        open={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
        onConfirm={() => boardToDelete && deleteBoard.mutate(boardToDelete.id)}
        title="Delete board"
        message={
          boardToDelete
            ? `Delete "${boardToDelete.name}" and all its lists and cards? This cannot be undone.`
            : ""
        }
        isSubmitting={deleteBoard.isPending}
      />
    </div>
  );
}
