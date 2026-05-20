import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={cn(
            "w-full rounded-md border border-[var(--cr-line-strong)] bg-white px-3 py-2 text-sm text-[var(--cr-ink)] placeholder:text-[var(--cr-muted)] focus:outline-none focus:border-[var(--cr-accent)] focus:ring-2 focus:ring-[var(--cr-accent)]/20 disabled:opacity-60 disabled:cursor-not-allowed resize-y min-h-[80px]",
            error &&
              "border-[var(--cr-danger)] focus:border-[var(--cr-danger)] focus:ring-[var(--cr-danger)]/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--cr-danger)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--cr-muted)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
