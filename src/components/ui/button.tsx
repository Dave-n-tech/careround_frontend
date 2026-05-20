import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--cr-accent)] text-white hover:bg-[#0c6580] border border-[var(--cr-accent)] focus-visible:ring-[var(--cr-accent)]",
        outline:
          "border border-[var(--cr-line-strong)] bg-white text-[var(--cr-ink)] hover:bg-[#f8fafc]",
        ghost:
          "border border-transparent bg-transparent text-[var(--cr-ink)] hover:bg-[#eef2f6]",
        destructive:
          "bg-[var(--cr-danger)] text-white hover:bg-[#991b1b] border border-[var(--cr-danger)]",
        "outline-destructive":
          "border border-[var(--cr-danger)] text-[var(--cr-danger)] bg-white hover:bg-[#fee2e2]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-sm",
        icon: "h-9 w-9 text-sm",
        "icon-sm": "h-7 w-7 text-xs",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
