import Link from "next/link";

export function CtaBand({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] px-8 py-12 md:flex-row md:items-center md:px-12">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-[var(--muted)]">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          {label}
        </Link>
      </div>
    </section>
  );
}
