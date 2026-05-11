import type { ReactNode } from "react";
import { Icons } from "./icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 fadein"
      onClick={onClose}
    >
      <div
        className="panel rounded shadow-2xl"
        style={{ width }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b hairline">
          <div className="font-semibold">{title}</div>
          <button className="btn-ghost btn p-1.5" onClick={onClose}>
            <Icons.x size={16} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto scroll-thin">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t hairline flex justify-end gap-2 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
