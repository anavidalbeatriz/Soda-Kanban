import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "./styles";

interface InputModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder?: string;
  type?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  isSubmitting?: boolean;
}

export function InputModal({
  open,
  onClose,
  title,
  label,
  placeholder,
  type = "text",
  submitLabel = "Confirm",
  onSubmit,
  isSubmitting,
}: InputModalProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>{label}</label>
          <input
            type={type}
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={!value.trim() || isSubmitting} className={btnPrimary}>
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
