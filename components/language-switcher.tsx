"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { locales, localeLabel, switchLocaleHref } from "@/lib/i18n-nav";
import { cn } from "@/lib/utils";

const CLOSE_ANIMATION_MS = 120;

/**
 * Expandable language picker driven entirely by `locales` (i18n/config.ts) — adding a
 * locale there is enough for it to show up here, no hardcoded label list to maintain.
 *
 * The panel is portaled to `document.body` and positioned from the trigger's own
 * bounding rect, so it floats over the surrounding UI instead of pushing its
 * container's layout open — and it isn't clipped when embedded inside another
 * overflow-hidden popover (e.g. the dashboard topbar's profile dropdown).
 */
export function LanguageSwitcher({
  locale,
  className,
  triggerClassName,
  onNavigate,
}: {
  locale: string;
  className?: string;
  triggerClassName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function open() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setState("open");
  }

  function close() {
    setState((current) => {
      if (current !== "open") return current;
      closeTimerRef.current = setTimeout(() => setState("closed"), CLOSE_ANIMATION_MS);
      return "closing";
    });
  }

  useEffect(() => {
    if (state === "closed") return;
    function isInside(target: EventTarget | null) {
      const node = target as Node | null;
      return (node && triggerRef.current?.contains(node)) || (node && panelRef.current?.contains(node));
    }
    function onPointerDown(e: PointerEvent) {
      if (!isInside(e.target)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [state]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  if (locales.length < 2) return null;

  const panelVisible = state !== "closed";
  const isOpen = state === "open";

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
          {localeLabel(locale)}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--muted)] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {panelVisible &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            data-state={isOpen ? "open" : "closed"}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
            className="dropdown-panel z-[100] origin-top rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-xl"
          >
            <nav aria-label="Language" className="flex flex-col gap-0.5">
              {locales.map((code) => {
                const active = code === locale;
                return (
                  <Link
                    key={code}
                    href={switchLocaleHref(pathname, code, locale)}
                    hrefLang={code}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      close();
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    )}
                  >
                    {localeLabel(code)}
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>,
          document.body
        )}
    </div>
  );
}
