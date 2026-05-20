import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--cr-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-md border border-[var(--cr-line-strong)] bg-white px-3 py-2 text-sm text-[var(--cr-ink)] placeholder:text-[var(--cr-muted)] focus:outline-none focus:border-[var(--cr-accent)] focus:ring-2 focus:ring-[var(--cr-accent)]/20 disabled:opacity-60 disabled:cursor-not-allowed min-h-[38px]",
              leftIcon && "pl-9",
              rightElement && "pr-10",
              error && "border-[var(--cr-danger)] focus:border-[var(--cr-danger)] focus:ring-[var(--cr-danger)]/20",
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center">{rightElement}</span>
          )}
        </div>
        {error && <p className="text-xs text-[var(--cr-danger)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--cr-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
