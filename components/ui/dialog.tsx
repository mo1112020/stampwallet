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
      />
      {/* `fixed inset-0`, not a height sized off any viewport unit: a fixed
       * box with top and bottom both set fills the real viewport by itself
       * (see app/[locale]/dashboard/layout.tsx for the full reasoning — this
       * is the same trick, applied here too). That alone doesn't solve
       * keyboard-safety for an autofocused input though: on iOS Safari the
       * layout viewport this box fills doesn't shrink for the keyboard, so
       * if this box were vertically *centered*, the center point drifts away
       * from the middle of what's actually visible once the keyboard is up,
       * and a centered dialog's input can end up below the fold. Anchoring
       * to the top instead of centering sidesteps that with no viewport
       * math at all: an autofocused input near the top of dialog content
       * (e.g. the command palette's search box) simply stays above where a
       * keyboard would ever cover, on any device, keyboard open or not.
       * Centered on `sm:` and up, where there's no on-screen keyboard to
       * begin with. Individual dialogs (e.g. the command palette, which
       * already positions itself with its own `mt-[20vh] self-start`) can
       * still add their own top offset via `className` — this only changes
       * the *default* so callers that don't opt into anything specific
       * (e.g. the print preview dialog) get top alignment instead of
       * centering on mobile. */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <DialogPrimitive.Content
          data-radix-content
          className={cn(
            "relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl focus:outline-none sm:max-h-[85vh]",
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
