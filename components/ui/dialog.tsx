"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: DialogPrimitive.DialogContentProps & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-radix-overlay
        className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]"
        style={{ height: "var(--app-dvh, 100dvh)" }}
      />
      {/* Sized off the dashboard shell's own `--app-dvh` (falls back to
       * 100dvh outside the dashboard, e.g. marketing/auth dialogs) instead of
       * a raw `fixed inset-0`/100%: on iOS Safari the layout viewport (what
       * `inset-0`/vh/dvh alone resolve against) doesn't shrink when the
       * on-screen keyboard opens, so a dialog with an autofocused input
       * (e.g. the command palette) could get vertically centered against the
       * *pre-keyboard* height and end up with its input below the fold of
       * the actually-visible area. Capping height + scrolling overflow here
       * keeps it reachable instead. */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
        style={{ height: "var(--app-dvh, 100dvh)" }}
      >
        <DialogPrimitive.Content
          data-radix-content
          className={cn(
            "relative my-auto max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl focus:outline-none",
            className
          )}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close className="absolute end-4 top-4 rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold text-[var(--ink)]", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[13px] text-[var(--muted)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
