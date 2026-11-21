import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastCtx {
  toast: (type: ToastItem["type"], message: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);
let _id = 0;

const icons: Record<ToastItem["type"], string> = {
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
  info: "M12 8h.01M12 12v4",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastItem["type"], message: string) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const styles = {
    success: "bg-success-bg text-success border border-success",
    error: "bg-danger-bg text-danger border border-danger",
    info: "bg-info-bg text-info border border-info",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`flex items-center gap-2 rounded-button px-4 py-3 text-small font-medium shadow-modal animate-[toast-in_var(--duration-med)_var(--ease-out)] ${styles[t.type]}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={icons[t.type]} />
            </svg>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
