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
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-2 fadein sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel rounded w-full max-h-[94vh] shadow-2xl sm:max-h-[90vh]"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b hairline sm:px-5">
          <div className="font-semibold">{title}</div>
          <button className="btn-ghost btn p-1.5" onClick={onClose}>
            <Icons.x size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto scroll-thin sm:p-5">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t hairline flex flex-wrap justify-end gap-2 bg-slate-50 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
