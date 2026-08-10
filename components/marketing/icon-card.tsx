import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon + title + body card — the pattern already established on the
 * support page, reused everywhere else a plain text-only card grid used to
 * stand in for it (Features, Industries, Infrastructure, About). */
export function IconCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
      {href && cta && (
        <p className="mt-4 text-sm font-semibold text-[var(--primary)]">
          {cta} <span className="inline-block rtl:-scale-x-100">→</span>
        </p>
      )}
    </>
  );

  const cardClass = cn(
    "flex flex-col rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7",
    href && "transition hover:border-[var(--line-strong)]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}
