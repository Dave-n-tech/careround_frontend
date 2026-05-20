import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { AcuityColor, VhiStatus } from "@/types/domain";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        red: "bg-red-100 text-red-700 border border-red-200",
        amber: "bg-amber-100 text-amber-700 border border-amber-200",
        green: "bg-green-100 text-green-700 border border-green-200",
        blue: "bg-blue-100 text-blue-700 border border-blue-200",
        neutral: "bg-slate-100 text-slate-600 border border-slate-200",
        teal: "bg-teal-100 text-teal-700 border border-teal-200",
        purple: "bg-purple-100 text-purple-700 border border-purple-200",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ─── Acuity badge ─────────────────────────────────────────────────────────────

const acuityVariant: Record<AcuityColor, "red" | "amber" | "green"> = {
  RED: "red",
  AMBER: "amber",
  GREEN: "green",
};

function AcuityBadge({ color }: { color: AcuityColor }) {
  return <Badge variant={acuityVariant[color]}>{color}</Badge>;
}

// ─── VHI badge ────────────────────────────────────────────────────────────────

const vhiVariant: Record<VhiStatus, "red" | "amber" | "green"> = {
  CRITICAL: "red",
  WATCH: "amber",
  STABLE: "green",
};

function VhiBadge({ score, status, size }: { score: number; status: VhiStatus; size?: "sm" | "lg" }) {
  return (
    <Badge variant={vhiVariant[status]} className={size === "lg" ? "text-sm px-3 py-1" : undefined}>
      {score} · {status}
    </Badge>
  );
}

// ─── Acuity colour strip ──────────────────────────────────────────────────────

function AcuityStrip({ color, className }: { color: AcuityColor; className?: string }) {
  const bg = { RED: "bg-red-600", AMBER: "bg-amber-500", GREEN: "bg-green-500" }[color];
  return <div className={cn("w-1.5 shrink-0 rounded-l", bg, className)} />;
}

export { Badge, badgeVariants, AcuityBadge, VhiBadge, AcuityStrip };
