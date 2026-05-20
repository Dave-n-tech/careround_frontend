import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-md border border-[var(--cr-line-strong)] bg-white px-3 py-2 text-sm text-[var(--cr-ink)] focus:outline-none focus:border-[var(--cr-accent)] focus:ring-2 focus:ring-[var(--cr-accent)]/20 disabled:opacity-60 disabled:cursor-not-allowed min-h-[38px]",
            error &&
              "border-[var(--cr-danger)] focus:border-[var(--cr-danger)] focus:ring-[var(--cr-danger)]/20",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[var(--cr-danger)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--cr-muted)]">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
