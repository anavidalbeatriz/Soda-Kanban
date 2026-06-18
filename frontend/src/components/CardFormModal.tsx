import { useEffect, useState } from "react";
import type { BoardList, WorkspaceMember } from "../types";
import { CardFields } from "./CardFields";
import { Modal } from "./ui/Modal";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "./ui/styles";
import {
  hasCardFormErrors,
  validateCardForm,
  type CardFormErrors,
} from "../utils/cardValidation";

export interface CardFormData {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
}

interface CardFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CardFormData) => void;
  isSubmitting?: boolean;
  lists?: BoardList[];
  listId?: string;
  onListChange?: (listId: string) => void;
  members: WorkspaceMember[];
}

export function CardFormModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  lists,
  listId,
  onListChange,
  members,
}: CardFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [errors, setErrors] = useState<CardFormErrors>({});

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssigneeId("");
      setErrors({});
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateCardForm({
      title,
      description,
      due_date: dueDate,
      assignee_id: assigneeId,
    });
    setErrors(formErrors);
    if (hasCardFormErrors(formErrors)) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate,
      assignee_id: assigneeId,
    });
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

        <CardFields
          values={{ title, description, due_date: dueDate, assignee_id: assigneeId }}
          errors={errors}
          members={members}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onDueDateChange={setDueDate}
          onAssigneeChange={setAssigneeId}
          autoFocusTitle
        />

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? "Creating..." : "Create card"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
