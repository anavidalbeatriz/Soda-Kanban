import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Card } from "../types";
import { boardApi } from "../api/client";
import { Modal } from "./ui/Modal";
import { DatePicker } from "./ui/DatePicker";
import { btnPrimary, inputClass, labelClass } from "./ui/styles";

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setDueDate(card.due_date ? card.due_date.slice(0, 10) : "");
    }
  }, [card]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", card?.id],
    queryFn: () => boardApi.comments(card!.id).then((r) => r.data),
    enabled: !!card,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      boardApi.updateCard(card!.id, {
        title,
        description,
        due_date: dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => boardApi.addComment(card!.id, comment),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", card?.id] });
    },
  });

  return (
    <Modal open={!!card} onClose={onClose} title="Card details" size="lg">
      {card && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Due date</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>

          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className={`w-full ${btnPrimary} py-2.5`}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="mb-3 text-sm font-medium text-gray-300">Comments</h3>
            <div className="space-y-2 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-gray-800 p-3 text-sm">
                  <p className="font-medium text-gray-200">{c.author.name}</p>
                  <p className="text-gray-400 mt-0.5">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) commentMutation.mutate();
                }}
              />
              <button
                onClick={() => commentMutation.mutate()}
                disabled={!comment.trim() || commentMutation.isPending}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
