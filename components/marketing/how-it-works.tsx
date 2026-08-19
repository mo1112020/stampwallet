import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { HowItWorksTimeline } from "@/components/motion/how-it-works-timeline";

export type WorkflowStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Scan → join → wallet → earn → reward, as a connected step row (column on
 * mobile) rather than another paragraph explaining the same flow in prose. */
export function HowItWorks({
  title,
  description,
  steps,
  stepLabel = "Step",
}: {
  title: string;
  description: string;
  steps: WorkflowStep[];
  stepLabel?: string;
}) {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal as="div" className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">{title}</h2>
          <p className="mt-4 text-[var(--muted)]">{description}</p>
        </Reveal>

        <HowItWorksTimeline>
          {/* A real ordered list — this genuinely is a sequence (scan → join
              → wallet → earn → reward), not just a grid of cards that
              happens to have numbers on it. */}
          <StaggerGroup as="ol" className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
            {/* Connecting ledger rule — desktop only, sits behind the stamp
                boxes. Rendered fully drawn by default; the timeline collapses
                and redraws it once scrolled into view. An <li>, not a <div>,
                since <ol>'s only valid children are list items — it's
                absolutely positioned and aria-hidden either way, so this
                doesn't change layout or how it's announced. */}
            <li
              data-connector-line
              className="pointer-events-none absolute inset-x-0 top-6 hidden h-0.5 origin-left list-none bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_10px,transparent_10px_18px)] md:block rtl:origin-right"
              aria-hidden="true"
            />

            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 md:flex-col md:gap-0 md:text-center">
                <span
                  data-step-icon
                  className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--line-strong)] bg-[var(--surface)] text-[var(--primary)] md:mx-auto"
                >
                  <step.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="md:mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {stepLabel} {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--muted)]">{step.description}</p>
                </div>
              </li>
            ))}
          </StaggerGroup>
        </HowItWorksTimeline>
      </div>
    </section>
  );
}
