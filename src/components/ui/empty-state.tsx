import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, message, sub, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3 text-center", className)}>
      {icon && <span className="text-[var(--cr-muted)] mb-1">{icon}</span>}
      <p className="text-sm font-medium text-[var(--cr-ink-2)]">{message}</p>
      {sub && <p className="text-xs text-[var(--cr-muted)] max-w-xs">{sub}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
