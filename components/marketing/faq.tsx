"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_KEYS = ["app", "paper", "cost", "pos", "industries", "launch"] as const;

export function FaqSection() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState<string | null>("app");

  return (
    <div className="mx-auto max-w-2xl divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {FAQ_KEYS.map((key) => {
        const isOpen = open === key;
        return (
          <div key={key}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-start"
              onClick={() => setOpen(isOpen ? null : key)}
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium text-[var(--ink)] md:text-lg">
                {t(`items.${key}.q`)}
              </span>
              <ChevronDown
                className={cn(
                  "shrink-0 text-[var(--muted)] transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                size={18}
              />
            </button>
            {isOpen && (
              <p className="pb-5 pr-8 text-[var(--muted)]">{t(`items.${key}.a`)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
