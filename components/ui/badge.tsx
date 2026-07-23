import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-3)] text-[var(--ink)]",
        primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
        success: "bg-[var(--success-soft)] text-[var(--success)]",
        danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
        warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
        outline: "border border-[var(--line)] text-[var(--muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
