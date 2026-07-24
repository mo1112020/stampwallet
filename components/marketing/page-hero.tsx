import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";

export function PageHero({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="bg-[var(--surface)] px-6 pb-16 pt-32 md:pb-24 md:pt-36">
      <Reveal as="div" className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="text-[13px] font-medium text-[var(--primary)]">{eyebrow}</p>
        )}
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--ink)] md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base text-[var(--muted)] md:text-lg">{description}</p>
        {(ctaHref || secondaryHref) && (
          <div className="mt-9 flex flex-wrap gap-3">
            {ctaHref && ctaLabel && (
              <Link href={ctaHref} className={buttonVariants()}>
                {ctaLabel}
              </Link>
            )}
            {secondaryHref && secondaryLabel && (
              <Link href={secondaryHref} className={buttonVariants({ variant: "outline" })}>
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
}
