import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";

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
      <Reveal
        as="div"
        className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] px-8 py-12 md:flex-row md:items-center md:px-12"
      >
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-[var(--muted)]">{description}</p>
        </div>
        <Link href={href} className={buttonVariants({ className: "shrink-0" })}>
          {label}
        </Link>
      </Reveal>
    </section>
  );
}
