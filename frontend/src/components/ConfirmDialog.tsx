import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-body text-foreground-muted leading-body">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-button border border-border bg-surface px-4 py-2 text-small font-medium text-foreground transition-colors duration-fast hover:bg-surface-alt focus:outline-none"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-button px-4 py-2 text-small font-medium text-on-dark transition-colors duration-fast focus:outline-none ${
            danger ? "bg-danger hover:bg-danger/85" : "bg-primary hover:bg-primary-hover"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
