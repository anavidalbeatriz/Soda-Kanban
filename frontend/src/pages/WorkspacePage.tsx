import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { InputModal } from "../components/ui/InputModal";
import { btnPrimary, btnSecondary, cardClass } from "../components/ui/styles";
import { workspaceApi } from "../api/client";

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards", workspaceId],
    queryFn: () => workspaceApi.boards(workspaceId!).then((r) => r.data),
    enabled: !!workspaceId,
  });

  const createBoard = useMutation({
    mutationFn: (name: string) => workspaceApi.createBoard(workspaceId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", workspaceId] });
      setBoardModalOpen(false);
    },
  });

  const inviteUser = useMutation({
    mutationFn: (email: string) => workspaceApi.createInvitation(workspaceId!, email),
    onSuccess: (res) => {
      setInviteModalOpen(false);
      alert(`Invite link: ${res.data.invite_url}`);
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader
        title="Boards"
        actions={
          <>
            <button onClick={() => setBoardModalOpen(true)} className={btnPrimary}>
              New board
            </button>
            <button onClick={() => setInviteModalOpen(true)} className={btnSecondary}>
              Invite user
            </button>
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
              <Link key={board.id} to={`/boards/${board.id}`} className={cardClass}>
                <h3 className="font-medium text-white">{board.name}</h3>
                <p className="text-xs text-gray-500 mt-1 capitalize">{board.visibility}</p>
              </Link>
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

      <InputModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite user"
        label="Email"
        type="email"
        placeholder="user@example.com"
        submitLabel="Send invite"
        onSubmit={(email) => inviteUser.mutate(email)}
        isSubmitting={inviteUser.isPending}
      />
    </div>
  );
}
