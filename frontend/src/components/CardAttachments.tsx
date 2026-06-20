import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi, uploadAttachment } from "../api/client";
import type { Attachment } from "../types";
import { MAX_ATTACHMENT_BYTES } from "../types";
import { ConfirmModal } from "./ui/ConfirmModal";
import { btnGhost, btnPrimary } from "./ui/styles";

interface CardAttachmentsProps {
  cardId: string;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CardAttachments({ cardId }: CardAttachmentsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);

  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", cardId],
    queryFn: () => boardApi.attachments(cardId).then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(cardId, file),
    onSuccess: () => {
      setUploadError("");
      queryClient.invalidateQueries({ queryKey: ["attachments", cardId] });
    },
    onError: () => {
      setUploadError("Could not upload file. Try again or use a file up to 10MB.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => boardApi.deleteAttachment(cardId, attachmentId),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["attachments", cardId] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setUploadError("File is too large (max 10MB).");
      return;
    }

    setUploadError("");
    uploadMutation.mutate(file);
  };

  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-gray-300">Attachments</h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className={btnPrimary}
        >
          {uploadMutation.isPending ? "Uploading..." : "Attach file"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {uploadError && <p className="mb-3 text-sm text-red-400">{uploadError}</p>}

      <div className="space-y-2">
        {attachments.length === 0 && (
          <p className="text-sm text-gray-500">No attachments yet.</p>
        )}
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-gray-800 p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              {attachment.download_url ? (
                <a
                  href={attachment.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium text-blue-400 hover:text-blue-300"
                >
                  {attachment.filename}
                </a>
              ) : (
                <span className="truncate font-medium text-gray-200">{attachment.filename}</span>
              )}
              {attachment.size_bytes != null && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatFileSize(attachment.size_bytes)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDeleteTarget(attachment)}
              className={`shrink-0 ${btnGhost}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete attachment"
        message={`Delete "${deleteTarget?.filename}"? This cannot be undone.`}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
}
