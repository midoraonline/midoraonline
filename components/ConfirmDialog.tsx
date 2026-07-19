"use client";

import FormModal from "@/components/FormModal";

/**
 * Modal confirmation for destructive or high-risk actions.
 *
 * Skill §7.3 — irreversible operations must use FormModal, not window.confirm.
 * Skill §12.5 — reversible operations should use a sonner toast with Undo.
 * Pick this component only when there is no restore path.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <FormModal
      title={title}
      onClose={busy ? () => {} : onClose}
      maxWidthClass="sm:max-w-sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="dm-btn dm-btn-ghost dm-btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="dm-btn dm-btn-primary"
            style={destructive ? { background: "var(--error)" } : undefined}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-foreground">{message}</p>
    </FormModal>
  );
}
