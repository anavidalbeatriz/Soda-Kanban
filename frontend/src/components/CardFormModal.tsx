import { useEffect, useState } from "react";
import type { BoardList } from "../types";
import { Modal } from "./ui/Modal";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "./ui/styles";

export interface CardFormData {
  title: string;
  description: string;
  due_date: string;
}

interface CardFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CardFormData) => void;
  isSubmitting?: boolean;
  lists?: BoardList[];
  listId?: string;
  onListChange?: (listId: string) => void;
}

export function CardFormModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  lists,
  listId,
  onListChange,
}: CardFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDueDate("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), due_date: dueDate });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {lists && lists.length > 1 && (
          <div>
            <label className={labelClass}>List</label>
            <select
              value={listId}
              onChange={(e) => onListChange?.(e.target.value)}
              className={inputClass}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Title</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card name"
            autoFocus
            required
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
          />
        </div>

        <div>
          <label className={labelClass}>Due date</label>
          <input
            type="date"
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={!title.trim() || isSubmitting} className={btnPrimary}>
            {isSubmitting ? "Creating..." : "Create card"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
