import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, hint, error, required, children }: FieldProps) {
  return (
    <label className="block">
      <div className="field-label mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </div>
      {children}
      {hint && !error && <div className="text-[11px] ink-mute mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-red-700 mt-1">{error}</div>}
    </label>
  );
}
