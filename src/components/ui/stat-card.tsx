import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "neutral" | "green" | "amber" | "red";
  className?: string;
}

const variantStyles = {
  neutral: "bg-white",
  green: "bg-green-50 border-green-200",
  amber: "bg-amber-50 border-amber-200",
  red: "bg-red-50 border-red-200",
};

const valueStyles = {
  neutral: "text-[var(--cr-ink)]",
  green: "text-green-700",
  amber: "text-amber-700",
  red: "text-red-700",
};

export function StatCard({ label, value, sub, variant = "neutral", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--cr-line)] p-5 flex flex-col gap-1",
        variantStyles[variant],
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">
        {label}
      </span>
      <span className={cn("text-3xl font-bold", valueStyles[variant])}>{value}</span>
      {sub && <span className="text-xs text-[var(--cr-muted)]">{sub}</span>}
    </div>
  );
}
