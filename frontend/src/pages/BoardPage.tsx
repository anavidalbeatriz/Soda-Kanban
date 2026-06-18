import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { boardApi, workspaceApi } from "../api/client";
import { KanbanBoard } from "../components/KanbanBoard";
import { CardDetailModal } from "../components/CardDetailModal";
import { CardFormModal, type CardFormData } from "../components/CardFormModal";
import { AppHeader } from "../components/layout/AppHeader";
import { btnPrimary, inputClass } from "../components/ui/styles";
import { useBoardSocket } from "../hooks/useBoardSocket";
import type { BoardEvent, Card } from "../types";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [visibility, setVisibility] = useState<string>("");
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [targetListId, setTargetListId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => boardApi.detail(boardId!).then((r) => r.data),
    enabled: !!boardId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", data?.board.workspace_id],
    queryFn: () => workspaceApi.members(data!.board.workspace_id).then((r) => r.data),
    enabled: !!data?.board.workspace_id,
  });

  const assigneeNames = Object.fromEntries(members.map((m) => [m.user_id, m.user.name]));

  const moveMutation = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) =>
      boardApi.moveCard(cardId, listId, position),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
  });

  const updateBoard = useMutation({
    mutationFn: (vis: string) => boardApi.update(boardId!, { visibility: vis as "private" | "team" | "public" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
  });

  const createCard = useMutation({
    mutationFn: ({ listId, ...payload }: CardFormData & { listId: string }) =>
      boardApi.createCard(listId, {
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date || null,
        assignee_id: payload.assignee_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      setCardFormOpen(false);
    },
  });

  const handleSocketEvent = useCallback(
    (event: BoardEvent) => {
      if (["card.moved", "card.updated", "card.created", "card.deleted", "list.created"].includes(event.type)) {
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      }
    },
    [boardId, queryClient]
  );

  useBoardSocket(boardId, handleSocketEvent);

  const openCardForm = (listId?: string) => {
    setTargetListId(listId ?? data?.lists[0]?.id ?? "");
    setCardFormOpen(true);
  };

  const handleCreateCard = (formData: CardFormData) => {
    if (!targetListId) return;
    createCard.mutate({ listId: targetListId, ...formData });
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading board...</p>
      </div>
    );
  }

  const currentVisibility = visibility || data.board.visibility;

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader
        backTo={{ label: "Back to boards", href: `/workspaces/${data.board.workspace_id}` }}
        title={data.board.name}
        actions={
          <>
            <select
              value={currentVisibility}
              onChange={(e) => {
                setVisibility(e.target.value);
                updateBoard.mutate(e.target.value);
              }}
              className={`${inputClass} w-auto py-1.5`}
            >
              <option value="private">Private</option>
              <option value="team">Team</option>
              <option value="public">Public</option>
            </select>
            <button onClick={() => openCardForm()} className={btnPrimary}>
              Add card
            </button>
          </>
        }
      />

      <main className="p-4 md:p-6">
        <KanbanBoard
          lists={data.lists}
          cards={data.cards}
          assigneeNames={assigneeNames}
          onMoveCard={(cardId, listId, position) => moveMutation.mutate({ cardId, listId, position })}
          onSelectCard={setSelectedCard}
          onAddCard={openCardForm}
        />
      </main>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} members={members} />

      <CardFormModal
        open={cardFormOpen}
        onClose={() => setCardFormOpen(false)}
        onSubmit={handleCreateCard}
        isSubmitting={createCard.isPending}
        lists={data.lists}
        listId={targetListId}
        onListChange={setTargetListId}
        members={members}
      />
    </div>
  );
}
