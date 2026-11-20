interface NoticeProps {
  variant?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Notice({ variant = "info", children, onDismiss }: NoticeProps) {
  const styles = {
    info: "bg-info/10 text-info border-info/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    success: "bg-success/10 text-success border-success/30",
    error: "bg-danger/10 text-danger border-danger/30",
  };

  return (
    <div
      className={`flex items-start gap-2 rounded-input border px-4 py-3 text-small ${styles[variant]}`}
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 opacity-60 hover:opacity-100"
        >
          &times;
        </button>
      )}
    </div>
  );
}
