import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Icons } from "./icons";

type ToastKind = "success" | "error" | "warn" | "info";

type ToastInput = {
  title: string;
  body?: string;
  kind?: ToastKind;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = (toast: ToastInput) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const item = { id, kind: "info", ...t } as ToastItem;
    setToasts((prev) => [...prev, item]);
    const duration = t.duration ?? 4500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => add, [add]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed left-3 right-3 top-3 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:top-6 sm:w-[360px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fadein panel rounded shadow-lg p-3 flex gap-2 items-start"
            style={{
              borderLeft: `4px solid ${
                t.kind === "error"
                  ? "#b91c1c"
                  : t.kind === "warn"
                    ? "#b45309"
                    : t.kind === "success"
                      ? "#15803d"
                      : "#0b5cab"
              }`
            }}
          >
            <div className="flex-1">
              <div className="font-semibold text-[13px]">{t.title}</div>
              {t.body && <div className="text-xs ink-mute mt-0.5">{t.body}</div>}
            </div>
            <button className="btn-ghost btn p-1" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
              <Icons.x size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
