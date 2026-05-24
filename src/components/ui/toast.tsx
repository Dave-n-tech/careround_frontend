import { useState, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  detail?: string;
}

// Module-level singleton — no context required, works from anywhere
let items: ToastItem[] = [];
const subscribers = new Set<(items: ToastItem[]) => void>();

function publish() {
  subscribers.forEach((s) => s([...items]));
}

function remove(id: string) {
  items = items.filter((t) => t.id !== id);
  publish();
}

function add(variant: ToastVariant, message: string, detail?: string) {
  const id = `${Date.now()}-${Math.random()}`;
  items = [...items, { id, variant, message, detail }];
  publish();
  setTimeout(() => remove(id), 5000);
}

export const toast = {
  success: (message: string, detail?: string) => add("success", message, detail),
  error: (message: string, detail?: string) => add("error", message, detail),
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const isSuccess = item.variant === "success";
  return (
    <div
      className={`flex items-start gap-3 w-80 rounded-lg border px-4 py-3 shadow-lg bg-white pointer-events-auto
        ${isSuccess ? "border-green-200" : "border-red-200"}`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
        : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">{item.message}</p>
        {item.detail && <p className="text-xs text-[var(--cr-muted)] mt-0.5">{item.detail}</p>}
      </div>
      <button onClick={onDismiss} className="text-[var(--cr-muted)] hover:text-[var(--cr-ink)] shrink-0 mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    subscribers.add(setToasts);
    return () => { subscribers.delete(setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  );
}
