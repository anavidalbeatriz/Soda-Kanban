import { Modal } from "./Modal";
import { btnDanger, btnSecondary } from "./styles";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isSubmitting = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-400">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={isSubmitting} className={btnSecondary}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={isSubmitting} className={btnDanger}>
          {isSubmitting ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
